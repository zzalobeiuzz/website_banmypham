const express = require("express");
const router = express.Router();

const {
	addOrder,
	markPaid,
	getUserOrders,
	getOrderDetail,
} = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");

//  ================ TẠO ĐƠN HÀNG MỚI ================
// POST /api/user/orders/add-orders
router.post("/add-orders", addOrder);

//================= ĐÁNH DẤU ĐƠN HÀNG ĐÃ THANH TOÁN ================
// POST /api/user/orders/mark-paid 
router.post("/mark-paid", authMiddleware.verifyToken, markPaid);

//================= LẤY DANH SÁCH ĐƠN HÀNG CỦA USER ================
// GET /api/user/orders
router.get("/", authMiddleware.verifyToken, getUserOrders);

//================= LẤY CHI TIẾT ĐƠN HÀNG ================
// GET /api/user/orders/detail/:orderId
router.get("/detail/:orderId", authMiddleware.verifyToken, getOrderDetail);

module.exports = router;
