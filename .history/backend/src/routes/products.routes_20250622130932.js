const express = require("express");
const router = express.Router();
const productController = require("../controllers/products.controller");

// GET /api/products
rrouter.get('/sale', productController.getSaleProducts);

module.exports = router;
