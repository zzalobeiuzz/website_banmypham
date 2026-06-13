const {
  getAllBrands: getAllBrandsService,
  createBrand: createBrandService,
  updateBrand: updateBrandService,
  deleteBrand: deleteBrandService,
} = require("./brand.service");

async function getAllBrands(req, res) {
  try {
    const result = await getAllBrandsService();
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi getAllBrands:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách thương hiệu.",
    });
  }
}

async function createBrand(req, res) {
  try {
    const result = await createBrandService(req);
    return res.status(201).json(result);
  } catch (error) {
    console.error("❌ Lỗi createBrand:", error.message);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Không thể tạo thương hiệu.",
    });
  }
}

async function updateBrand(req, res) {
  try {
    const result = await updateBrandService(req);
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi updateBrand:", error.message);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Không thể cập nhật thương hiệu.",
    });
  }
}

async function deleteBrand(req, res) {
  try {
    const result = await deleteBrandService(req);
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi deleteBrand:", error.message);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Không thể xóa thương hiệu.",
    });
  }
}

module.exports = {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
};
