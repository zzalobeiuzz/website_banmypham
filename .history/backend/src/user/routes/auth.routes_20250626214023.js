const express = require("express");
const router = express.Router();

// Import đúng
const { loginHandler,sendVerificationCode, registerHandler } = require("../controllers/auth.controller");
const { validateLoginInput } = require("../middlewares/validateInput");

// Định nghĩa route
router.post("/login", validateLoginInput, loginHandler);

// Gửi thông tin đăng kí để tạo mới người dùng
router.post("/register", registerHandler);
// Quên mật khẩu -> kiểm tra email có tồn tại -> 
router.post("/register", registerHandler);
// Gửi mã xác thực nếu email tồn tại
router.post("/sendVerificationCode", sendVerificationCode); 

module.exports = router;
