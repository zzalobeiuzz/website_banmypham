const { getAllOrdersFromBill, getOrderDetailFromBill } = require("../models/order.model");

exports.handleGetOrders = async (req, res) => {
  try {
    const orders = await getAllOrdersFromBill();
    return res.json({ success: true, data: orders });
  } catch (error) {
    console.error("❌ Lỗi handleGetOrders:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể tải dữ liệu đơn hàng từ BILL/BILL_DETAIL.",
    });
  }
};

exports.handleGetOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await getOrderDetailFromBill(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng.",
      });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    console.error("❌ Lỗi handleGetOrderDetail:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể tải chi tiết đơn hàng.",
    });
  }
};
