const { SePayPgClient } = require("sepay-pg-node");

/**
 * Tạo dữ liệu checkout để gửi sang cổng thanh toán SePay.
 *
 * Luồng xử lý (chi tiết):
 * 1) Kiểm tra cấu hình môi trường (SEPAY_MERCHANT_ID, SEPAY_SECRET_KEY, SEPAY_ENV)
 *    - Nếu thiếu key => ném lỗi ngay lập tức để caller (service/controller) xử lý.
 *
 * 2) Khởi tạo SePay client (`SePayPgClient`) với cấu hình:
 *    - `env`: 'sandbox' hoặc 'production' (tự động xác định từ SEPAY_ENV)
 *    - `merchant_id`, `secret_key` lấy từ biến môi trường
 *    - `api_version`/`checkout_version` có thể override bằng env
 *
 * 3) Gọi `client.checkout.initOneTimePaymentFields({...})` để tạo các trường form ẩn
 *    - Thông tin bắt buộc gồm: `operation`, `payment_method`, `order_invoice_number`,
 *      `order_amount`, `currency`, `order_description`, `success_url`, `error_url`, `cancel_url`
 *    - `customer_id` có thể truyền nếu muốn mapping khách hàng bên SePay
 *    - `custom_data` để lưu metadata (voucher, discount, subtotal, paymentMethod) —
 *      lưu dạng JSON string để webhook/callback có thể parse và cập nhật order phù hợp.
 *
 * 4) Lấy `checkoutUrl` từ `client.checkout.initCheckoutUrl()`
 *    - Frontend sẽ render một `<form action={checkoutUrl} method="POST">`
 *      và thêm các hidden inputs tương ứng với `fields`, sau đó submit form.
 *
 * 5) Lưu ý quan trọng:
 *    - `order_amount` phải là số nguyên hoặc decimal phù hợp với yêu cầu SePay (đơn vị VND trong ví dụ).
 *    - Backend nên tạo order (ghi vào DB) trước khi gọi `buildSepayCheckout` để
 *      có `orderId` làm `order_invoice_number` (giúp mapping khi webhook trả về).
 *    - Webhook SePay phải verify signature/secret (nếu SePay cung cấp) để tránh spoofing.
 *    - `custom_data` chứa metadata nhưng không nên chứa thông tin nhạy cảm (thẻ, mật khẩu...).
 *
 * 6) Trả về object:
 *    {
 *      checkoutUrl: string,
 *      fields: { [name]: value }
 *    }
 *
 * Ví dụ frontend: render form với các `fields` và submit tới `checkoutUrl`.
 *
 * @param {Object} params
 * @param {string|number} params.orderId - ID đơn hàng (dùng làm order_invoice_number)
 * @param {number} params.total - Tổng số tiền thanh toán (số) — kiểm tra đơn vị tiền
 * @param {string} [params.userId] - ID khách hàng (tùy chọn)
 * @param {string} [params.paymentMethod] - Phương thức thanh toán (ví dụ: 'TRANSFER')
 * @param {string} [params.voucher]
 * @param {number} [params.discount]
 * @param {number} [params.subtotal]
 * @returns {{checkoutUrl: string, fields: Object}}
 */


        /**------------------------------------------------
         * 💳 Tạo dữ liệu thanh toán SePay (Checkout)
         * --------------------------------------------------
         * 📌 Flow:
         * Backend → tạo fields → frontend POST → SePay → thanh toán
         */
exports.buildSepayCheckout = ({
  orderId,
  total,
  userId,
  paymentMethod,
  voucher,
  discount,
  subtotal,
}) => {

  // 🌍 Xác định môi trường SePay
  // - production → môi trường thật
  // - sandbox → môi trường test
  const env =
    String(process.env.SEPAY_ENV || "sandbox").toLowerCase() === "production"
      ? "production"
      : "sandbox";

  // 🔐 Thông tin merchant (bắt buộc)
  const merchantId = process.env.SEPAY_MERCHANT_ID;
  const secretKey = process.env.SEPAY_SECRET_KEY;

  // 🌐 URL frontend để redirect sau thanh toán
  const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";

  // ❗ Check thiếu config
  if (!merchantId || !secretKey) {
    throw new Error(
      "Thiếu SEPAY_MERCHANT_ID hoặc SEPAY_SECRET_KEY trong biến môi trường."
    );
  }

  // 🔌 Khởi tạo SePay client
  const client = new SePayPgClient({
    env, // 🌍 môi trường   
    merchant_id: merchantId, // 🏪 mã merchant
    secret_key: secretKey,   // 🔐 key bảo mật
    api_version: process.env.SEPAY_API_VERSION || "v1",
    checkout_version: process.env.SEPAY_CHECKOUT_VERSION || "v1",
  });
  console.log("env:", env, "merchantId:", merchantId, "secretKey:", secretKey ? "✅" : "❌");
  // 📦 Tạo dữ liệu thanh toán (fields)
  const fields = client.checkout.initOneTimePaymentFields({
    operation: "PURCHASE", // 🛒 hành động thanh toán
    payment_method: "BANK_TRANSFER", // 🏦 chuyển khoản

    order_invoice_number: String(orderId), // 🆔 mã đơn hàng
    order_amount: Number(total) || 0,      // 💰 số tiền
    currency: "VND",                       // 💱 đơn vị tiền

    order_description: `Thanh toan don hang ${orderId}`, // 📝 mô tả

    customer_id: userId ? String(userId) : undefined, // 👤 user (optional)

    // 🔁 URL redirect sau thanh toán
    success_url: `${frontendBase}/payment/success?order_id=${encodeURIComponent(
      String(orderId)
    )}`,
    error_url: `${frontendBase}/payment/error?order_id=${encodeURIComponent(
      String(orderId)
    )}`,
    cancel_url: `${frontendBase}/payment/cancel?order_id=${encodeURIComponent(
      String(orderId)
    )}`,

    // 📦 Dữ liệu bổ sung (custom)
    custom_data: JSON.stringify({
      voucher,       // 🎟️ mã giảm giá
      discount,      // 💸 số tiền giảm
      subtotal,      // 🧾 tổng trước giảm
      paymentMethod, // 💳 phương thức
    }),
  });

  // 🔗 Trả về cho frontend
  return {
    checkoutUrl: client.checkout.initCheckoutUrl(), // 🌐 URL cổng thanh toán
    fields, // 📦 dữ liệu POST (có chữ ký bảo mật)
  };
};
