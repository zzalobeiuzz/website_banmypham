const express = require("express");
const router = express.Router();
const productController = require("../controllers/products.controller");

// GET /api/products
router.get("/", productController.getAllProducts);

module.exports = router;
