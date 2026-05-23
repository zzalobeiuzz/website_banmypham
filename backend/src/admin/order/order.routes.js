const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/verifyToken.middleware");


const {
  handleGetOrders,
  handleGetOrderDetail
} = require("./order.controller");

router.use(
  authMiddleware.verifyToken,
  authMiddleware.verifyAdmin
);

router.get("/", handleGetOrders);

router.get("/:orderId", handleGetOrderDetail);

module.exports = router;