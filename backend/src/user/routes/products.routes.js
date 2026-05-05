//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const {
  getSaleProductsHandler,
  getHotProductsHandler,
  getFeaturedBrandsHandler,
  getCategoryHandler,
  getProductsHandler,
  getProductDetailHandler,
  getBrandDetailPageHandler,
  getCartProductsHandler
} = require("../controllers/products.controller");

// Định nghĩa các route trong Express Router
router.get("/sale", getSaleProductsHandler);
router.get("/hot", getHotProductsHandler);
router.get("/featured-brands", getFeaturedBrandsHandler);
router.get("/loadCategory", getCategoryHandler);
router.get("/loadAllProducts", getProductsHandler);
router.get("/brand/:idBrand", getBrandDetailPageHandler);
router.get("/detail/:id", getProductDetailHandler);

//========API giỏ hàng===============
// Lấy thông tin sản phẩm dựa trên id
router.post("/cart", getCartProductsHandler);

module.exports = router;
