const express = require("express");
const router = express.Router();

const {
  update,
  checkExisProduct,
  addProduct,
} = require("../controllers/product.controller");

const upload = require("../middlewares/upload.middleware");

// PUT: update sản phẩm
router.put("/updateProducts", update);

// GET: kiểm tra sản phẩm tồn tại (barcode)
router.get("/checkProductExistence", checkExisProduct);
// GET: Lấy thông tin sản phẩm
router.get("/getProductDetail", checkExisProduct);
// POST: thêm sản phẩm mới (có upload hình ảnh)
router.post("/add", upload.single("Image"), addProduct);


module.exports = router;
