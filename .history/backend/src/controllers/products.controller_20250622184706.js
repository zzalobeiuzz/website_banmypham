// controllers/product.controller.js
const { getSaleProducts, getProductByIdFromDB } = require("../services/product.service");

// Gửi danh sách sản phẩm khuyến mãi
exports.getSaleProductsHandler = async (req, res) => {
  try {
    const products = await getSaleProducts();
    res.status(200).json(products);
  } catch (err) {
    console.error("❌ Lỗi khi lấy sale products:", err.message);   // <-- in thông báo lỗi
    console.error("❌ Stack trace:", err.stack);                    // <-- in vết lỗi đầy đủ
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm khuyến mãi." });
  }
};

// Gửi sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const product = await getProductByIdFromDB(id);

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    res.status(200).json(product);
  } catch (err) {
    console.error("Lỗi khi truy vấn sản phẩm theo ID:", err);
    res.status(500).json({ message: "Lỗi server." });
  }
};
