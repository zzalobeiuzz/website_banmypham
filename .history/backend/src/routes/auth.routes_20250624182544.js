const express = require("express");
const router = express.Router();

// Import đúng
const { loginHandler } = require("../controllers/auth.controller");
const { validateLoginInput } = require("../middlewares/validateInput");

// Định nghĩa route
router.post("/login", validateLoginInput, loginHandler);

// Gửi thông tin email + role, tạo mã
router.post("/register", registerHandler);

// Link xác thực email gửi qua Gmail
router.get("/verify-email", verifyEmailHandler);

module.exports = router;
