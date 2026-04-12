const { getAllOrdersFromBill } = require("../models/order.model");

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
