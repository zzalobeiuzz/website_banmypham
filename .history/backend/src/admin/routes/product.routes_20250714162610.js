//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const{
    update,
    checkExisProduct,
    uploadPreviewImage,
    addProduct,
} = require("../controllers/product.controller")
const upload = require("../middlewares/upload.middleware"); // dùng multer

router.put("/updateProducts",update )
router.get("/checkProductExistence", checkExisProduct )
router.post("/preview_upload", uploadPreviewImage);
// router.post("/add", upload.single("Image"), addProduct);
router.post("/add", upload.single("Image"), async (req, res) => {
    console.log(req.file);
    // {
    //   fieldname: 'Image',
    //   originalname: 'hinh1.png',
    //   encoding: '7bit',
    //   mimetype: 'image/png',
    //   destination: '../../../../frontend/public/assets/pictures/',
    //   filename: '1721058000000-123456789.png',
    //   path: '../../../../frontend/public/assets/pictures/1721058000000-123456789.png',
    //   size: 12345
    // }
  });
module.exports = router;
