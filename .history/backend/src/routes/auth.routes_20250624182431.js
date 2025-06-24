const express = require("express");
const router = express.Router();

// Import đúng
const { loginHandler } = require("../controllers/auth.controller");
const { validateLoginInput } = require("../middlewares/validateInput");

// Định nghĩa route
router.post("/login", validateLoginInput, loginHandler);

// Gửi thông tin email + role, tạo mã
router.post("/register", registerHandler);

// Xác nhận mã từ client
router.post("/verify-email", verifyEmailHandler);

module.exports = router;
