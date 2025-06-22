//============= Khai báo
const express = require("express");
const router = express.Router();

const {
  getSaleProductsHandler,
  getHotProductsHandler,
} = require("../controllers/products.controller");

// Định nghĩa các route trong Express Router
router.get("/sale", getSaleProductsHandler);
router.get("/hot", getHotProductsHandler);

module.exports = router;
