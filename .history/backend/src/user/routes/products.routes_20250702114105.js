//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const {
  getSaleProductsHandler,
  getHotProductsHandler,
} = require("../controllers/products.controller");

// Định nghĩa các route trong Express Router
router.get("/sale", getSaleProductsHandler);
router.get("/hot", getHotProductsHandler);
router.get("/loadCategory", getloadCategoryHandler);

module.exports = router;
