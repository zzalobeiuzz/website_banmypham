const express = require("express");
const router = express.Router();

const {
	update,
	checkExisProduct,
	addProduct,
	handleProductDetail,
	updateProductDetail,
	deleteProducts,
} = require("./product.controller");

const upload = require("../middlewares/upload.middleware");

const { verifyToken, verifyAdmin } = require("../middlewares/verifyToken.middleware");

router.use(verifyToken, verifyAdmin);

router.put("/updateProducts", update);
router.get("/checkProductExistence", checkExisProduct);
router.get("/productDetail", handleProductDetail);
router.put("/updateProductDetail", updateProductDetail);
router.post("/add", upload.single("Image"), addProduct);
router.delete("/deleteProducts", deleteProducts);

module.exports = router;
