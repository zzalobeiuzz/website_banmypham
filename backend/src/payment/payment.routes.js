const express = require("express");
const paymentController = require("./payment.controller");

const router = express.Router();

// Tạo checkout trực tiếp (không bắt buộc phải có order trong DB)
// POST /api/payment/create-checkout
router.post("/create-checkout", paymentController.handleCreatePayment);

// Webhook từ Sepay khi thanh toán thành công
// POST /api/payment/sepay/webhook
router.post("/sepay/webhook", paymentController.handleWebhook);

// Webhook từ MOMO khi thanh toán thành công (IPN)
// POST /api/payment/momo-ipn (legacy)
router.post("/momo-ipn", paymentController.handleMomoIPN);

// Webhook từ MOMO khi thanh toán thành công (standardized)
// POST /api/payment/momo-webhook
router.post("/momo-webhook", paymentController.handleMomoIPN);

// 🧪 TEST ENDPOINT - Giả lập MOMO webhook thành công
// POST /api/payment/momo-test-webhook
router.post("/momo-test-webhook", paymentController.handleMomoTestWebhook);

module.exports = router;