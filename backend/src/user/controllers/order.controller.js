// controllers/orderController.js

const {
  handleCODPayment,
  handleTransferPayment,
  handleMOMOPayment,
} = require("../services/orderService");

const { updateBillStatus, getOrderByOrderId } = require("../models/order.model");

exports.addOrder = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    console.log("+ Đang kiểm tra paymentMethod:", paymentMethod);
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

/**
 * 💳 Đánh dấu đơn hàng đã thanh toán 
 */
exports.markPaid = async (req, res) => {
  console.log("📥 markPaid endpoint called with body:", req.body);
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu orderId",
      });
    }

    const order = await getOrderByOrderId(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    const result = await updateBillStatus(orderId, "Đã thanh toán");

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
        order,
      });
    }

    return res.json({
      success: result.success,
      message: result.message,
      order: {
        ...order,
        status: "Đã thanh toán",
        paymentStatus: "success",
      },
    });
  } catch (err) {
    console.error("❌ markPaid error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi server.",
    });
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