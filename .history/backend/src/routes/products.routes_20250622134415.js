const express = require("express");
const router = express.Router();
const {
  getSaleProductsHandler,
  getProductById,
} = require("../controllers/product.controller");

router.get("/sale", getSaleProductsHandler);
router.get("/:id", getProductById);

module.exports = router;
