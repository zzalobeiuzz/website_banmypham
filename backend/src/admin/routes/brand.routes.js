const express = require("express");
const router = express.Router();

const { getAllBrands, createBrand, updateBrand } = require("../controllers/brand.controller");
const { verifyToken, verifyAdmin } = require("../middlewares/verifyToken.middleware");
const upload = require("../middlewares/upload.middleware");

router.use(verifyToken, verifyAdmin);

router.get("/", getAllBrands);
router.post("/", upload.single("logoFile"), createBrand);
router.put("/:idBrand", upload.single("logoFile"), updateBrand);

module.exports = router;