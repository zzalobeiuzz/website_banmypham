const productService = require("../services/product.service");

exports.update = async (req, res) => {
  try {
    const product = req.body;
    con
    const result = await productService.updateProduct(product);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi update:", error.message);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};
