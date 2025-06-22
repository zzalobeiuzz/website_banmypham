const express = require("express");
const router = express.Router();
const productController = require("../controllers/products.controller");

// GET /api/products
router.get('/sale', productController.getSaleProducts);

module.exports = router;
