const express = require("express");
const router = express.Router();

const {
	getAllBrands,
	createBrand,
	updateBrand,
} = require("./brand.controller");
const authMiddleware = require("../middlewares/verifyToken.middleware");
const upload = require("../middlewares/upload.middleware");

router.use(authMiddleware.verifyToken, authMiddleware.verifyAdmin);

router.get("/", getAllBrands);
router.post("/", upload.single("logoFile"), createBrand);
router.put("/:idBrand", upload.single("logoFile"), updateBrand);

module.exports = router;
