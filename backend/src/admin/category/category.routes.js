const express = require("express");
const router = express.Router();

const {
	getAllCategories,
	addCategory,
	addSubCategory,
	deleteSubCategory,
	deleteCategory,
} = require("./category.controller");

// Mọi route ở đây đều cần xác thực token và quyền admin
const authMiddleware = require("../middlewares/verifyToken.middleware");

// Hàm xử lý middleware để xác thực token và quyền admin 
// sẽ được áp dụng trước cho tất cả các route trong router này
router.use(authMiddleware.verifyToken, authMiddleware.verifyAdmin);

// Lấy toàn bộ danh mục và danh mục con.
router.get("/", getAllCategories);

// Tạo danh mục cha mới.
router.post("/add", addCategory);

// Tạo danh mục con trong một danh mục cha.
router.post("/sub/add", addSubCategory);

// Xóa danh mục con theo ID.
router.delete("/sub/:subCategoryId", deleteSubCategory);

// Xóa danh mục cha theo ID.
router.delete("/:categoryId", deleteCategory);

module.exports = router;
