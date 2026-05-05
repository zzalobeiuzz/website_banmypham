const express = require("express");
const { handleWebhook, handleCreatePayment } = require("./payment.controller");

const router = express.Router();

// Tạo checkout trực tiếp (không bắt buộc phải có order trong DB)
// POST /api/payment/create-checkout
router.post("/create-checkout", handleCreatePayment);

// Webhook phải công khai để Sepay có thể gửi dữ liệu về
// POST /api/payment/sepay/webhook
router.post("/sepay/webhook", handleWebhook);

module.exports = router;