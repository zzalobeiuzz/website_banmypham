const express = require("express");
const router = express.Router();

const {
	getAllBatches,
	createBatch,
	getProductsByBatchId,
	addProductToBatch,
	updateBatch,
	deleteBatch,
	updateProductInBatch,
} = require("../controllers/batch.controller");

// Mọi route ở đây đều cần xác thực token và quyền admin
const { verifyToken, verifyAdmin } = require("../middlewares/verifyToken.middleware");

// Hàm xử lý middleware để xác thực token và quyền admin 
// sẽ được áp dụng trước cho tất cả các route trong router này
router.use(verifyToken, verifyAdmin);

// Lấy danh sách tất cả lô hàng.
router.get("/", getAllBatches);

// Tạo lô hàng mới.
router.post("/", createBatch);

// Lấy danh sách sản phẩm theo một lô hàng.
router.get("/:batchId/products", getProductsByBatchId);

// Thêm sản phẩm vào lô hàng.
router.post("/:batchId/products", addProductToBatch);

// Cập nhật thông tin sản phẩm trong lô hàng.
router.put("/:batchId/products", updateProductInBatch);

// Cập nhật thông tin chung của lô hàng.
router.put("/:batchId", updateBatch);

// Xóa (hoặc vô hiệu hóa) lô hàng theo ID.
router.delete("/:batchId", deleteBatch);

module.exports = router;
