const express = require("express");
const router = express.Router();
const {
  getSaleProductsHandler,
  getProductById,
} = require("../controllers/products.controller");

router.get("/sale", getSaleProducts);
router.get("/:id", getProductById);

module.exports = router;
