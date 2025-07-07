//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const {
  getSaleProductsHandler,
  getHotProductsHandler,
  getCategoryHandler,
  getProductsHandler,
} = require("../controllers/products.controller");

// Định nghĩa các route trong Express Router
router.get("/sale", getSaleProductsHandler);
router.get("/hot", getHotProductsHandler);
router.get("/loadCategory", getCategoryHandler);
router.get("/loadAllProducts", getProductsHandler);

module.exports = router;
