const express = require("express");
const router = express.Router();

const {
  addOrder,
  markPaid,
  getUserOrders,
  getOrderDetail,
  lookupOrderPublic,
} = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// POST /api/user/orders/add-orders
router.post("/add-orders", addOrder);

// POST /api/user/orders/mark-paid
router.post("/mark-paid", authMiddleware.verifyToken, markPaid);

// GET /api/user/orders
router.get("/", authMiddleware.verifyToken, getUserOrders);

// GET /api/user/orders/lookup/:orderId
router.get("/lookup/:orderId", lookupOrderPublic);

// GET /api/user/orders/detail/:orderId
router.get("/detail/:orderId", authMiddleware.verifyToken, getOrderDetail);

module.exports = router;
