//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const{verifyToken,verifyAdmin} = require("../middlewares/verifyToken.middleware")
const{refreshToken, handleGetAccounts, handleResetAccountPassword, handleCreateAccount, handleDeleteAccount} = require("../controllers/account.controller")

// GET /api/admin/
// Dùng để xác thực token hiện tại có đúng quyền admin hay không.
router.get("/", verifyToken, verifyAdmin, (req, res) => {
    res.json({
      message: "Hello Admin! Bạn đã được xác thực.",
      user: req.user,
    });
  });

// POST /api/admin/refresh-token
// Dùng refresh token để cấp access token mới khi access token hết hạn.
router.post("/refresh-token",refreshToken)

// GET /api/admin/accounts
// Lấy toàn bộ thông tin trong bảng ACCOUNT.
router.get("/accounts", verifyToken, verifyAdmin, handleGetAccounts);

// POST /api/admin/accounts
// Tạo tài khoản mới.
router.post("/accounts", verifyToken, verifyAdmin, handleCreateAccount);

// PUT /api/admin/accounts/:email/reset-password
// Reset mật khẩu của tài khoản theo email.
router.put("/accounts/:email/reset-password", verifyToken, verifyAdmin, handleResetAccountPassword);

// DELETE /api/admin/accounts/:email
// Xóa tài khoản theo email.
router.delete("/accounts/:email", verifyToken, verifyAdmin, handleDeleteAccount);
module.exports = router;