const express = require("express");
const router = express.Router();

const {
  update,
  checkExisProduct,
//   uploadPreviewImage,
  // addProduct,
  saveExternalImage,
} = require("../controllers/product.controller");

const upload = require("../middlewares/upload.middleware");

// PUT: update sản phẩm
router.put("/updateProducts", update);

// GET: kiểm tra sản phẩm tồn tại (barcode)
router.get("/checkProductExistence", checkExisProduct);

// POST: thêm sản phẩm mới (có upload hình ảnh)
// router.post("/add", upload.single("Image"), addProduct);
router.post("/add", (req, res, next) => {
    upload.single("Image")(req, res, function (err) {
      if (err) {
        // 👉 Lỗi multer (ví dụ: quá dung lượng, sai định dạng, ...)
        console.log("❌ Lỗi multer:", err.message);
  
        // Gửi lỗi trả về client
        return res.status(400).json({
          success: false,
          message: `Lỗi upload: ${err.message}`,
        });
      }
      // Nếu không lỗi, tiếp tục gọi controller
      next();
    });
  }, addProduct);

// ✅ POST: lưu ảnh từ URL external
router.post("/save_external_images", saveExternalImage);

module.exports = router;
