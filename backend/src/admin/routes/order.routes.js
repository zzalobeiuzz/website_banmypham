const express = require("express");
const router = express.Router();

const { verifyToken, verifyAdmin } = require("../middlewares/verifyToken.middleware");
const { handleGetOrders, handleGetOrderDetail } = require("../controllers/order.controller");

router.use(verifyToken, verifyAdmin);

// GET /api/admin/orders
router.get("/", handleGetOrders);

// GET /api/admin/orders/:orderId
router.get("/:orderId", handleGetOrderDetail);

module.exports = router;
