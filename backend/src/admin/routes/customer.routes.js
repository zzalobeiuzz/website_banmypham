const express = require("express");
const router = express.Router();

const {
  handleGetCustomers,
  handleGetCustomerDetail,
  handleDeleteCustomer,
  handleResetCustomerPassword,
  handleUpdateCustomer,
} = require("../controllers/customer.controller");

// Mọi route ở đây đều cần xác thực token và quyền admin

const { verifyToken, verifyAdmin } = require("../middlewares/verifyToken.middleware");

// Hàm xử lý middleware để xác thực token và quyền admin 
// sẽ được áp dụng trước cho tất cả các route trong router này

router.use(verifyToken, verifyAdmin);

// Lấy danh sách khách hàng cho trang quản trị.
router.get("/", handleGetCustomers);

// Lấy thông tin chi tiết của 1 khách hàng theo customerId.
router.get("/:customerId", handleGetCustomerDetail);

// Cập nhật thông tin cơ bản của khách hàng.
router.put("/:customerId", handleUpdateCustomer);

// Xóa hoặc vô hiệu hóa khách hàng.
router.delete("/:customerId", handleDeleteCustomer);

// Reset mật khẩu tài khoản khách hàng về mặc định.
router.put("/:customerId/reset-password", handleResetCustomerPassword);

module.exports = router;
