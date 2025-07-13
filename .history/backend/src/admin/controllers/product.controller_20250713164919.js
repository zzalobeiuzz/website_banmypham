const productService = require("../services/product.service");
//=========================UPDATE THÔNG TIN SẢN PHẨM====================
exports.update = async (req, res) => {
  try {
    const products = req.body;

    // Kiểm tra luôn: phải là mảng
    if (!Array.isArray(products)) {
      return res
        .status(400)
        .json({ message: "Dữ liệu phải là một mảng sản phẩm" });
    }

    for (const product of products) {
      console.log("👉 Updating product:", product.ProductID);

      await productService.updateProduct(product);
    }

    res
      .status(200)
      .json({ success: true, message: "Cập nhật tất cả sản phẩm thành công!" });
  } catch (error) {
    console.error("❌ Lỗi update:", error.message);
    res.status(500).json({ message: "Có lỗi xảy ra khi cập nhật sản phẩm" });
  }
};
//=========================CHECK SẢN PHẨM TỒN TẠI====================
exports.checkBarcode = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: "Thiếu ID sản phẩm" });
  }

  try {
    const result = await productService.checkProductExistence(code);
    return res.json(result);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ message: "Lỗi server khi kiểm tra sản phẩm" });
  }
};
