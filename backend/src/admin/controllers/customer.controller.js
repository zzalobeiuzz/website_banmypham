const {
  getCustomerList,
  getCustomerDetail,
  deleteCustomer,
  resetCustomerPassword,
  updateCustomerInfo,
} = require("../models/customer.model");
const bcrypt = require("bcrypt");

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

/**
 * PUT /api/admin/customers/:customerId/reset-password
 * Reset mật khẩu về mặc định cho khách có tài khoản
 */
exports.handleResetCustomerPassword = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { newPassword } = req.body || {};

    if (!customerId) {
      return res.status(400).json({ success: false, message: "Thiếu customerId" });
    }

    if (!newPassword || typeof newPassword !== "string") {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mật khẩu mới.",
      });
    }

    const normalizedPassword = newPassword.trim();
    if (normalizedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    const updated = await resetCustomerPassword(customerId, hashedPassword);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Khách hàng chưa có tài khoản để reset mật khẩu.",
      });
    }

    return res.json({
      success: true,
      message: "Đã reset mật khẩu thành công.",
    });
  } catch (error) {
    console.error("❌ Lỗi handleResetCustomerPassword:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/customers/:customerId
 * Cập nhật thông tin cơ bản khách hàng
 */
exports.handleUpdateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { fullName, phoneNumber, address } = req.body || {};

    if (!customerId) {
      return res.status(400).json({ success: false, message: "Thiếu customerId" });
    }

    const normalizedFullName = String(fullName || "").trim();
    const normalizedPhoneNumber = String(phoneNumber || "").trim();
    const normalizedAddress = String(address || "").trim();

    if (!normalizedFullName) {
      return res.status(400).json({ success: false, message: "Tên khách hàng không được để trống." });
    }

    if (!normalizedPhoneNumber) {
      return res.status(400).json({ success: false, message: "Số điện thoại không được để trống." });
    }

    if (!normalizedAddress) {
      return res.status(400).json({ success: false, message: "Địa chỉ không được để trống." });
    }

    const updated = await updateCustomerInfo({
      customerId,
      fullName: normalizedFullName,
      phoneNumber: normalizedPhoneNumber,
      address: normalizedAddress,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Khách hàng không tồn tại." });
    }

    const latestCustomer = await getCustomerDetail(customerId);

    return res.json({
      success: true,
      message: "Cập nhật thông tin khách hàng thành công.",
      data: latestCustomer,
    });
  } catch (error) {
    console.error("❌ Lỗi handleUpdateCustomer:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
