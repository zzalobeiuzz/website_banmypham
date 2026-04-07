const brandService = require("../services/brand.service");

exports.getAllBrands = async (req, res) => {
  try {
    const result = await brandService.getAllBrands();
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi getAllBrands:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách thương hiệu.",
    });
  }
};

exports.createBrand = async (req, res) => {
  try {
    const result = await brandService.createBrand(req);
    return res.status(201).json(result);
  } catch (error) {
    console.error("❌ Lỗi createBrand:", error.message);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Không thể tạo thương hiệu.",
    });
  }
};