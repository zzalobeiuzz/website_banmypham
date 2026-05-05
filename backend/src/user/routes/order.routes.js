const express = require("express");
const router = express.Router();

const { addOrder, markPaid, getOrderDetail } = require("../controllers/order.controller");

//  ================ TẠO ĐƠN HÀNG MỚI ================
// POST /api/user/orders/add-orders
router.post("/add-orders", addOrder);

//================= ĐÁNH DẤU ĐƠN HÀNG ĐÃ THANH TOÁN ================
// POST /api/user/orders/mark-paid 
router.post("/mark-paid", markPaid);

//================= LẤY CHI TIẾT ĐƠN HÀNG ================
// GET /api/user/orders/detail/:orderId
router.get("/detail/:orderId", getOrderDetail);

module.exports = router;
