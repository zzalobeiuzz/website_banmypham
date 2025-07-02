//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const {
  productController
} = require("../controllers/products.controller");

// Định nghĩa các route trong Express Router
router.get("/sale",productController.getSaleProductsHandler);
router.get("/hot", productController.getHotProductsHandler);
router.get("/loadCategory", productController.getCategoryHandler);

module.exports = router;
