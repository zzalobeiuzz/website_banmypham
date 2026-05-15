const express = require("express");
const router = express.Router();

const { addOrder, markPaid, getOrderDetail, getUserOrders } = require("../controllers/order.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

//  ================ TẠO ĐƠN HÀNG MỚI ================
// POST /api/user/orders/add-orders
router.post("/add-orders", addOrder);

//================= ĐÁNH DẤU ĐƠN HÀNG ĐÃ THANH TOÁN ================
// POST /api/user/orders/mark-paid 
router.post("/mark-paid", verifyToken, markPaid);

//================= LẤY DANH SÁCH ĐƠN HÀNG CỦA USER ================
// GET /api/user/orders
router.get("/", verifyToken, getUserOrders);

//================= LẤY CHI TIẾT ĐƠN HÀNG ================
// GET /api/user/orders/detail/:orderId
router.get("/detail/:orderId", verifyToken, getOrderDetail);

module.exports = router;
