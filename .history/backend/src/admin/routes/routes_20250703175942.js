//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const {
  getSaleProductsHandler,
  getHotProductsHandler,
  getCategoryHandler,
} = require("../controllers/products.controller");

// Định nghĩa các route trong Express Router
router.get("/home", getSaleProductsHandler);
module.exports = router;
