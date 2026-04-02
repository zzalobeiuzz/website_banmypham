const express = require("express");
const router = express.Router();

const {
  update,
  checkExisProduct,
  addProduct,
  handleProductDetail,
  updateProductDetail,
  deleteProducts,
} = require("../controllers/product.controller");

const upload = require("../middlewares/upload.middleware");

// Mọi route ở đây đều cần xác thực token và quyền admin
const { verifyToken, verifyAdmin } = require("../middlewares/verifyToken.middleware");

// Hàm xử lý middleware để xác thực token và quyền admin 
// sẽ được áp dụng trước cho tất cả các route trong router này
router.use(verifyToken, verifyAdmin);

// Cập nhật thông tin tổng quan của sản phẩm.
router.put("/updateProducts", update);

// Kiểm tra sản phẩm đã tồn tại theo barcode hay chưa.
router.get("/checkProductExistence", checkExisProduct);

// Lấy chi tiết sản phẩm để hiển thị khi chỉnh sửa/xem.
router.get("/productDetail", handleProductDetail);

// Cập nhật phần thông tin chi tiết sản phẩm.
router.put("/updateProductDetail", updateProductDetail);

// Thêm sản phẩm mới và nhận ảnh upload (Image).
router.post("/add", upload.single("Image"), addProduct);

// Xóa mềm sản phẩm (ẩn sản phẩm khỏi danh sách hiển thị).
router.delete("/deleteProducts", deleteProducts);


module.exports = router;
