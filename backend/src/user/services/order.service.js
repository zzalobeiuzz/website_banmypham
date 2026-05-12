const { buildSepayCheckout } = require("../../payment/sepay.service");
const { insertBillAndDetails, updateBillStatus, getOrderByOrderId } = require("../models/order.model");

// ============================================
// 🎯 PAYMENT METHOD HANDLERS
// ============================================

/**
 * Xử lý thanh toán COD (Thanh toán khi nhận hàng)
 * @private
 */
exports.handleCODPayment = async (orderData) => {
  // 📥 Tạo order trong database (sử dụng function từ model)
  const orderResult = await insertBillAndDetails({
    ...orderData,
    status: "Đang xử lý",
  });

  return {
    success: true,
    paymentMethod: "COD",
    paymentRequired:false,
    data: orderResult,
  };
};


            /**------------------------------------------------
             * 💳 Xử lý thanh toán chuyển khoản (SePay)
             * --------------------------------------------------*/

exports.handleTransferPayment = async (orderData) => {
  try {
    // 📦 Lấy thông tin liên quan đến giảm giá
    const { voucher, discount, subtotal } = orderData;

    // ✅ STEP 1: TẠO ORDER TRONG DATABASE với status "Chờ thanh toán"
    // 💾 Gọi function từ order.model để insert BILL + BILL_DETAIL
    const orderResult = await insertBillAndDetails({
      ...orderData,
      status: "Chờ thanh toán", // ⏳ Đặt trạng thái chờ thanh toán
    });

    const orderId = orderResult.id; // 🆔 Lấy orderId từ order vừa tạo

    // ✅ STEP 2: TẠO PAYLOAD THANH TOÁN SEPAY
    // 🔐 Build checkout URL + fields từ orderId có sẵn trong DB
    const payment = buildSepayCheckout({
      orderId, // 🆔 mã đơn hàng (từ DB)
      total: orderData.total || 10000, // 💰 tổng tiền
      userId: orderData.userId || "1", // 👤 user
      paymentMethod: "TRANSFER", // 🏦 phương thức chuyển khoản

      voucher,   // 🎟️ mã giảm giá
      discount,  // 💸 số tiền giảm
      subtotal,  // 🧾 tổng trước giảm
    });

    // ✅ STEP 3: TRẢ KẾT QUẢ CHO FRONTEND
    return {
      success: true,                 // ✔️ thành công
      paymentRequired: true,         // 💳 cần thanh toán
      paymentProvider: "SEPAY",      // 🏦 cổng thanh toán
      paymentMethod: "TRANSFER",     // 🏦 phương thức thanh toán

      data: {
        id: orderId,                // 🆔 mã đơn (đã INSERT vào DB)
        status: "Chờ thanh toán",   // ⏳ trạng thái
      },

      payment, // 🔗 chứa checkoutUrl + fields
    };
  } catch (err) {
    // ❌ Log lỗi để debug
    console.error("❌ Sepay error:", err);

    // 🚨 Ném lỗi lên controller
    throw err;
  }
};

/**
 * Xử lý thanh toán MOMO (Ví MoMo)
 * @private
 * TODO: Implement MOMO payment gateway
 */
exports.handleMOMOPayment = async (orderData) => {
  // 📥 Tạo order trong database (sử dụng function từ model)
  const orderResult = await insertBillAndDetails({
    ...orderData,
    status: "Chờ thanh toán",
  });

  // TODO: Tạo form MOMO tương tự như TRANSFER
  return {
    success: true,
    paymentRequired: true,
    paymentProvider: "MOMO",
    data: {
      ...orderResult,
      status: "Chờ thanh toán",
    },
    message: "MOMO payment đang được xử lý...",
  };
};

/*================================================================
  Xử lý đơn hàng khi nhận được webhook thanh toán thành công từ SePay
 - Cập nhật trạng thái đơn hàng từ "Chờ thanh toán" → "Đã thanh toán"
 - Trả về thông tin đơn hàng đã cập nhật
 ================================================================*/
exports.markPaidService = async (orderId) => {
  if (!orderId) {
    throw new Error("Thiếu orderId");
  }

  //1. Lấy order (có thể throw nếu dữ liệu chi tiết bị lỗi)
  const existingOrder = await getOrderByOrderId(orderId);
  if (!existingOrder) {
    return { success: false, message: "Không tìm thấy đơn hàng" };
  }

  //2. Cập nhật trạng thái và trừ hàng tồn dựa trên đơn hàng đã có
  const result = await updateBillStatus(orderId, "Đã thanh toán");
  if (!result.success) {
    return { success: false, message: result.message };
  }

  //3. Lấy lại order đã cập nhật
  const updatedOrder = await getOrderByOrderId(orderId);

  return {
    success: true,
    message: result.message,
    order: updatedOrder,
  };
};

