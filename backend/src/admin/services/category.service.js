const categoryModel = require("../models/category.model");

exports.addCategory = async (categoryName) => {
  const normalizedName = String(categoryName || "").trim();

  if (!normalizedName) {
    return { success: false, message: "Tên danh mục không hợp lệ" };
  }

  const created = await categoryModel.createCategory(normalizedName);
  return {
    success: true,
    message: "Thêm danh mục thành công",
    data: created,
  };
};

exports.addSubCategory = async (categoryId, subCategoryName) => {
  const normalizedCategoryId = String(categoryId || "").trim();
  const normalizedSubName = String(subCategoryName || "").trim();

  if (!normalizedCategoryId || !normalizedSubName) {
    return { success: false, message: "Thiếu dữ liệu danh mục con" };
  }

  const result = await categoryModel.createSubCategory(normalizedCategoryId, normalizedSubName);

  if (!result.success && result.reason === "CATEGORY_NOT_FOUND") {
    return { success: false, message: "Không tìm thấy danh mục cha" };
  }

  if (!result.success) {
    return { success: false, message: "Không thể thêm danh mục con" };
  }

  return {
    success: true,
    message: "Thêm danh mục con thành công",
    data: result.data,
  };
};

exports.deleteCategorySoft = async (categoryId) => {
  const normalizedCategoryId = String(categoryId || "").trim();

  if (!normalizedCategoryId) {
    return { success: false, status: 400, message: "CategoryID không hợp lệ" };
  }

  const result = await categoryModel.softDeleteCategory(normalizedCategoryId);

  if ((result.affectedRows || 0) === 0) {
    return {
      success: false,
      status: 404,
      message: "Không tìm thấy danh mục để xóa",
    };
  }

  return {
    success: true,
    message: "Xóa danh mục thành công",
  };
};

exports.deleteSubCategory = async (subCategoryId) => {
  const normalizedSubCategoryId = String(subCategoryId || "").trim();

  if (!normalizedSubCategoryId) {
    return { success: false, status: 400, message: "SubCategoryID không hợp lệ" };
  }

  const result = await categoryModel.deleteSubCategory(normalizedSubCategoryId);

  if ((result.affectedRows || 0) === 0) {
    return {
      success: false,
      status: 404,
      message: "Không tìm thấy danh mục con để xóa",
    };
  }

  return {
    success: true,
    message: "Xóa danh mục con thành công",
  };
};

exports.getAllCategories = async () => {
  try {
    const categories = await categoryModel.getAllCategories();
    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh mục:", error);
    return {
      success: false,
      message: "Lỗi server khi lấy danh mục",
    };
  }
};
