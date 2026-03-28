const express = require("express");
const router = express.Router();

const {
  addCategory,
  addSubCategory,
  deleteCategory,
  deleteSubCategory,
  getAllCategories,
} = require("../controllers/category.controller");

router.get("/", getAllCategories);
router.post("/add", addCategory);
router.post("/sub/add", addSubCategory);
router.delete("/sub/:subCategoryId", deleteSubCategory);
router.delete("/:categoryId", deleteCategory);

module.exports = router;
