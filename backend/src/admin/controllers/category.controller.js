const categoryService = require("../services/category.service");

exports.addCategory = async (req, res) => {
  try {
    const { categoryName } = req.body || {};
    const result = await categoryService.addCategory(categoryName);

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
};

exports.addSubCategory = async (req, res) => {
  try {
    const { categoryId, subCategoryName } = req.body || {};
    const result = await categoryService.addSubCategory(categoryId, subCategoryName);

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
};

exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const result = await categoryService.deleteCategorySoft(categoryId);

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
};

exports.deleteSubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const result = await categoryService.deleteSubCategory(subCategoryId);

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
};

exports.getAllCategories = async (req, res) => {
  try {
    const result = await categoryService.getAllCategories();

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
};
