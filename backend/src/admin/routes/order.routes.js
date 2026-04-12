const express = require("express");
const router = express.Router();

const { verifyToken, verifyAdmin } = require("../middlewares/verifyToken.middleware");
const { handleGetOrders } = require("../controllers/order.controller");

router.use(verifyToken, verifyAdmin);

// GET /api/admin/orders
router.get("/", handleGetOrders);

module.exports = router;
