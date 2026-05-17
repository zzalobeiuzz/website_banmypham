const { buildSepayCheckout } = require("../../payment/sepay.service");
const axios = require("axios");
const https = require("https");
const crypto = require("crypto");
const {
  insertBillAndDetails,
  updateBillStatus,
  getOrderByOrderId,
} = require("../models/order.model");

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
    status: "Thanh toán COD",
  });

  return {
    success: true,
    paymentMethod: "COD",
    paymentRequired: false,
    data: orderResult,
  };
};

/**------------------------------------------------
 * 💳 Xử lý thanh toán chuyển khoản (SePay)
 * --------------------------------------------------*/

exports.handleTransferPayment = async (orderData) => {
  try {
    console.log("🚀 Bắt đầu xử lý thanh toán chuyển khoản");
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

      voucher, // 🎟️ mã giảm giá
      discount, // 💸 số tiền giảm
      subtotal, // 🧾 tổng trước giảm
    });

    // ✅ STEP 3: TRẢ KẾT QUẢ CHO FRONTEND
    return {
      success: true, // ✔️ thành công
      paymentRequired: true, // 💳 cần thanh toán
      paymentProvider: "SEPAY", // 🏦 cổng thanh toán
      paymentMethod: "TRANSFER", // 🏦 phương thức thanh toán

      data: {
        id: orderId, // 🆔 mã đơn (đã INSERT vào DB)
        status: "Chờ thanh toán", // ⏳ trạng thái
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
 * =========================================================
             🟣 XỬ LÝ THANH TOÁN MOMO SERVICE
 * =========================================================
 * 🔄 FLOW TỔNG THỂ
 * =========================================================
 * Frontend checkout
 *        ↓
 * Backend create order (pending)
 *        ↓
 * Backend gọi MOMO API
 *        ↓
 * MOMO trả payUrl
 *        ↓
 * Frontend redirect MOMO
 *        ↓
 * User thanh toán
 *        ↓
 * MOMO webhook callback
 *        ↓
 * Backend verify payment
 *        ↓
 * Update DB = Đã thanh toán
 */
exports.handleMOMOPayment = async (orderData) => {
  try {
    // ✅ KIỂM TRA: Tổng giá trị đơn hàng phải >= 50000 VND
    const orderTotal = Number(orderData.total) || 0;
    if (orderTotal < 50000) {
      return {
        success: false,
        message: `❌ Thanh toán MOMO yêu cầu tối thiểu 50.000 VND (hiện tại: ${orderTotal.toLocaleString("vi-VN")} VND)`,
        paymentRequired: false,
        paymentMethod: "MOMO",
      };
    }

    // 1: TẠO ĐƠN HÀNG TRONG DATABASE
    const orderResult = await insertBillAndDetails({
      ...orderData,
      status: "Chờ thanh toán",
    });

    //  2: LẤY orderId TỪ DATABASE
    const orderId = String(orderResult.id);

    //  3: Lấy thông tin xác thực của MOMO từ .env
    const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";

    const accessKey = process.env.MOMO_ACCESS_KEY;

    const secretKey = process.env.MOMO_SECRET_KEY;

    // Kiểm tra nếu thiếu key → ném lỗi để dev fix
    if (!accessKey || !secretKey) {
      throw new Error("❌ Thiếu MOMO_ACCESS_KEY hoặc MOMO_SECRET_KEY");
    }

    //  4: CHUẨN BỊ PAYMENT DATA theo mẫu MoMo payWithMethod
    const requestId = `${partnerCode}${Date.now()}`;
    const momoOrderId = `${partnerCode}${Date.now()}`;
    const amount = String(orderTotal);
    const orderInfo = process.env.MOMO_ORDER_INFO || "pay with MoMo";
    const redirectUrl =
      process.env.MOMO_REDIRECT_URL ||
      "http://localhost:3000/cart-detail?step=4";
    const ipnUrl =
      process.env.MOMO_WEBHOOK_URL ||
      "http://localhost:5000/api/payment/momo-webhook";
    const requestType = "payWithMethod";
    const extraData = String(orderId);
    const paymentCode = process.env.MOMO_PAYMENT_CODE || "";
    const orderGroupId = process.env.MOMO_ORDER_GROUP_ID || "";
    const autoCapture = true;
    const lang = "vi";

    // before sign HMAC SHA256 with format from MoMo docs
    const rawSignature =
      "accessKey=" +
      accessKey +
      "&amount=" +
      amount +
      "&extraData=" +
      extraData +
      "&ipnUrl=" +
      ipnUrl +
      "&orderId=" +
      momoOrderId +
      "&orderInfo=" +
      orderInfo +
      "&partnerCode=" +
      partnerCode +
      "&redirectUrl=" +
      redirectUrl +
      "&requestId=" +
      requestId +
      "&requestType=" +
      requestType;


    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");


    const requestBody = JSON.stringify({
      partnerCode: partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId: requestId,
      amount: amount,
      orderId: momoOrderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: lang,
      requestType: requestType,
      autoCapture: autoCapture,
      extraData: extraData,
      orderGroupId: orderGroupId,
      signature: signature,
      ...(paymentCode ? { paymentCode } : {}),
    });

    const options = {
      hostname: "test-payment.momo.vn",
      port: 443,
      path: "/v2/gateway/api/create",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
    };

    const responseData = await new Promise((resolve, reject) => {
      const momoReq = https.request(options, (momoRes) => {
        let body = "";

        momoRes.setEncoding("utf8");
        momoRes.on("data", (chunk) => {
          body += chunk;
        });
        momoRes.on("end", () => {
          resolve({ statusCode: momoRes.statusCode, body });
        });
      });

      momoReq.on("error", (e) => {
        reject(e);
      });

      console.log("Sending....");
      momoReq.write(requestBody);
      momoReq.end();
    });

    console.log(`Status: ${responseData.statusCode}`);
    console.log("Body:");
    console.log(responseData.body);

    let momoResponse;
    try {
      momoResponse = JSON.parse(responseData.body);
    } catch (parseErr) {
      throw new Error(
        `❌ MOMO response không phải JSON hợp lệ: ${parseErr.message}`,
      );
    }

    if (momoResponse.resultCode !== 0) {
      throw new Error(
        momoResponse.message ||
          momoResponse.localMessage ||
          "❌ MOMO tạo thanh toán thất bại",
      );
    }

    if (!momoResponse.payUrl) {
      throw new Error("❌ MOMO API không trả về payUrl");
    }

    // =====================================================
    // 📤 STEP 9: TRẢ KẾT QUẢ VỀ FRONTEND
    // =====================================================
    //
    // Frontend sẽ dùng:
    //
    // window.location.href = payUrl
    //
    // để redirect user sang MOMO.
    //
    // =====================================================

    return {
      success: true,

      paymentRequired: true,

      paymentProvider: "MOMO",

      paymentMethod: "MOMO",

      data: {
        id: orderId,
        status: "Chờ thanh toán",
      },

      payment: {
        // URL redirect MOMO
        payUrl: momoResponse.payUrl,

        // MOMO request id
        requestId: momoResponse.requestId || requestId,
      },

      message: "Tạo link MOMO thành công",
    };
  } catch (err) {
    // =====================================================
    // ❌ HANDLE ERROR
    // =====================================================
    //
    // Log chi tiết lỗi từ MOMO để debug.
    //
    // =====================================================

    console.error("❌ MOMO error:", err.message);

    // Log response từ MOMO nếu có
    if (err.response?.data) {
      console.error(
        "📥 MOMO Response Data:",
        JSON.stringify(err.response.data, null, 2),
      );
    }

    // Log toàn bộ request để kiểm tra
    if (err.config?.data) {
      console.error("📤 Request Data:", err.config.data);
    }

    throw err;
  }
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
