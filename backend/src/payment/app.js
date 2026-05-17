const express = require('express');
const router = express.Router();

const paymentRoutes = require('./payment.routes');
// Mount payment routes at root so final paths become /api/payment/...
router.use('/', paymentRoutes);

module.exports = router;