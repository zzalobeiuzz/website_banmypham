const express = require("express");
const router = express.Router();
const {
  getSaleProductsHandler,
  getProductById,
} = require("../");

router.get("/sale", getSaleProductsHandler);
router.get("/:id", getProductById);

module.exports = router;
