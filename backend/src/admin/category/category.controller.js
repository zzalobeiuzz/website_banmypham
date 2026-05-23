const {
  addCategory: addCategoryService,
  addSubCategory: addSubCategoryService,
  deleteCategorySoft: deleteCategorySoftService,
  deleteSubCategory: deleteSubCategoryService,
  getAllCategories: getAllCategoriesService,
} = require("./category.service");

async function addCategory(req, res) {
  try {
    const { categoryName } = req.body || {};
    const result = await addCategoryService(categoryName);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("❌ Lỗi addCategory:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm danh mục",
    });
  }
}

async function addSubCategory(req, res) {
  try {
    const { categoryId, subCategoryName } = req.body || {};
    const result = await addSubCategoryService(categoryId, subCategoryName);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("❌ Lỗi addSubCategory:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm danh mục con",
    });
  }
}

async function deleteCategory(req, res) {
  try {
    const { categoryId } = req.params;
    const result = await deleteCategorySoftService(categoryId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi deleteCategory:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa danh mục",
    });
  }
}

async function deleteSubCategory(req, res) {
  try {
    const { subCategoryId } = req.params;
    const result = await deleteSubCategoryService(subCategoryId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi deleteSubCategory:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa danh mục con",
    });
  }
}

async function getAllCategories(req, res) {
  try {
    const result = await getAllCategoriesService();

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi getAllCategories:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh mục",
    });
  }
}

module.exports = {
  addCategory,
  addSubCategory,
  deleteCategory,
  deleteSubCategory,
  getAllCategories,
};
