const express = require("express");
const router = express.Router();

// Import đúng
const { loginHandler } = require("../controllers/auth.controller");
const { validateLoginInput } = require("../middlewares/validateInput");

// Định nghĩa route
router.post("/login", validateLoginInput, loginHandler);

// Gửi thông tin email + role, tạo mã
router.post("/register", registerHandler);

// Gửi mã xác thực nếu email tồn tại
router.post("/register", sendVerificationCode); 

module.exports = router;
