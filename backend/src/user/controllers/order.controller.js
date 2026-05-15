// controllers/orderController.js

const {
  handleCODPayment,
  handleTransferPayment,
  handleMOMOPayment,
  markPaidService,
} = require("../services/order.service");
const { getOrdersByUserId, getOrderByOrderId } = require("../models/order.model");

exports.addOrder = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    // ✅ Kiểm tra paymentMethod là REQUIRED
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Thiếu paymentMethod. Bắt buộc phải chọn phương thức thanh toán: COD, TRANSFER, hoặc MOMO",
      });
    }

    // ✅ Kiểm tra phương thức thanh toán hợp lệ
    const pm = String(paymentMethod).toLowerCase();
    const validMethods = ["cod", "transfer", "momo"];

    // Nếu pm không nằm trong validMethods thì trả về lỗi
    if (!validMethods.includes(pm)) {
      return res.status(400).json({
        success: false,
        message: `Phương thức thanh toán không hợp lệ: ${paymentMethod}. Chỉ hỗ trợ: ${validMethods.join(", ").toUpperCase()}`,
      });
    }

    // ✅ Gọi handler tương ứng
    let result;
    switch (pm) {
      case "cod":
        result = await handleCODPayment(req.body);
        break;
      case "transfer":
        result = await handleTransferPayment(req.body);
        break;
      case "momo":
        result = await handleMOMOPayment(req.body);
        break;
    }

    return res.json(result);
  } catch (err) {
    console.error("❌ addOrder error:", err);

    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi server.",
    });
  }
};

exports.getUserOrders = async (req, res) => {
  console.log("📥----------------- Đang tải danh sách đơn hàng của bạn -----------------");
  try {
    const userId = req.user?.id || req.user?.userId || req.user?.UserID;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Thiếu thông tin user" });
    }

    const orders = await getOrdersByUserId(userId);
    console.log(`✅ Tải thành công ${orders.length} đơn hàng`);
    return res.json({ success: true, orders });
  } catch (err) {
    console.error("❌ getUserOrders error:", err);
    return res.status(err.status || 500).json({ success: false, message: err.message || "Lỗi server." });
  }
};

/**
 * 💳 XỬ LÝ ĐƠN HÀNG KHI ĐÃ THANH TOÁN THÀNH CÔNG
 */
exports.markPaid = async (req, res) => {
  console.log("📥 markPaid endpoint called with body:", req.body);
  try {
    //  Kiểm tra orderId trong body
    const { orderId } = req.body;
    // Nếu thiếu orderId, trả về lỗi rõ ràng
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Thiếu orderId" });
    }
    
    // Gọi service để cập nhật trạng thái đơn hàng
    let svcRes;
    try {
      svcRes = await markPaidService(orderId);
    } catch (err) {
      // Service threw (e.g. dữ liệu chi tiết bị lỗi) → trả lỗi rõ ràng
      return res.status(400).json({ success: false, message: err.message || "Lỗi xử lý đơn hàng" });
    }

    if (!svcRes || !svcRes.success) {
      const status = svcRes && svcRes.message && svcRes.message.includes("Không tìm thấy") ? 404 : 400;
      return res.status(status).json({ success: false, message: svcRes?.message || "Không thể cập nhật đơn hàng" });
    }

    return res.json({
      success: true,
      message: svcRes.message,
      order: {
        ...svcRes.order,
        status: "Đã thanh toán",
        paymentStatus: "success",
      },
    });
  } catch (err) {
    console.error("❌ markPaid error:", err);
    return res.status(err.status || 500).json({ success: false, message: err.message || "Lỗi server." });
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await getOrderByOrderId(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("❌ getOrderDetail error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi server.",
    });
  }
};