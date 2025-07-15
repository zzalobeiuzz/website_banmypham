//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const{
    update,
    checkExisProduct,
    uploadPreviewImage,
    addProduct,
} = require("../controllers/product.controller")
const upload = require("../"); // dùng multer

router.put("/updateProducts",update )
router.get("/checkProductExistence", checkExisProduct )
router.post("/preview_upload", uploadPreviewImage);
router.post("/add", upload.single("Image"), addProduct);
module.exports = router;
