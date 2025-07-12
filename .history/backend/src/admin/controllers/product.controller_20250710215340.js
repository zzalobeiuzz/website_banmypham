const productService = require("../services/product.service");

/**
 * PUT /api/products/updateProducts
 * Update nhiều sản phẩm cùng lúc
 */
exports.updateMultipleProducts = async (req, res) => {
  try {
    const updatedProducts = req.body.products; // 👈 Expect { products: [ { ProductID, ProductName, Price, ... } ] }

    if (!updatedProducts || !Array.isArray(updatedProducts)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ!" });
    }

    // Gọi service update từng sản phẩm
    for (const product of updatedProducts) {
      if (!product.ProductID) {
        return res.status(400).json({ message: "Thiếu ProductID!" });
      }
      await productService.updateProduct(product);
    }

    res.status(200).json({ message: "Cập nhật sản phẩm thành công!" });
  } catch (error) {
    console.error("Lỗi update products:", error);
    res.status(500).json({ message: "Có lỗi xảy ra khi cập nhật sản phẩm" });
  }
};
