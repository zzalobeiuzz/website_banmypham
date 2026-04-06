const express = require("express");
const router = express.Router();

const { getAllBrands } = require("../controllers/brand.controller");
const { verifyToken, verifyAdmin } = require("../middlewares/verifyToken.middleware");

router.use(verifyToken, verifyAdmin);

router.get("/", getAllBrands);

module.exports = router;