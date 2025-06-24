const express = require("express");
const router = express.Router();

// Import đúng
const { loginHandler } = require("../controllers/auth.controller");
const { validateLoginInput } = require("../middlewares/validateInput");

// Định nghĩa route
router.post("/login", validateLoginInput, loginHandler);

// ✅ Route xử lý email + role khi đăng ký (step 3)
router.post("/register", registerHandler);

module.exports = router;
