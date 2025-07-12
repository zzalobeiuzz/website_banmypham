const Product = require("../models/product.model");
const productService = require("../services/product.service");

exports.update = async (req, res) => {
  try {
    const productData = req.body;

    // Không ép thành mảng, xử lý 1 sản phẩm
    const productObj = new Product(productData);

    const exists = await productService.checkProductExists(productObj.ProductID);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: `Sản phẩm ID ${productObj.ProductID} không tồn tại`,
      });
    }

    const result = await productService.updateProduct(productObj);

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi update:", error.message);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};
