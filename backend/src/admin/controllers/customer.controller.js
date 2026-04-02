const {
  getCustomerList,
  getCustomerDetail,
  deleteCustomer,
} = require("../models/customer.model");

/**
 * GET /api/admin/customers
 * Lấy danh sách tất cả khách hàng
 */
exports.handleGetCustomers = async (req, res) => {
  try {
    const customers = await getCustomerList();
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error("❌ Lỗi handleGetCustomers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/customers/:customerId
 * Lấy chi tiết khách hàng + lịch sử đơn hàng
 */
exports.handleGetCustomerDetail = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ success: false, message: "Thiếu customerId" });
    }

    const customer = await getCustomerDetail(customerId);

    if (!customer) {
      return res.status(404).json({ success: false, message: "Khách hàng không tồn tại" });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error("❌ Lỗi handleGetCustomerDetail:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/customers/:customerId
 * Vô hiệu hóa khách hàng (chỉ có tài khoản)
 */
exports.handleDeleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ success: false, message: "Thiếu customerId" });
    }

    const result = await deleteCustomer(customerId);

    if (!result) {
      return res.status(404).json({ success: false, message: "Khách hàng không tồn tại hoặc không thể xóa" });
    }

    res.json({ success: true, message: "Xóa khách hàng thành công" });
  } catch (error) {
    console.error("❌ Lỗi handleDeleteCustomer:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
