// controllers/product.controller.js
const {getAllCategories,getSaleProducts,getHotProducts}= require("../services/product.service");

//============================ Gửi danh sách sản phẩm khuyến mãi=============================
exports.getSaleProductsHandler = async (req, res) => {
  try {
    const products = await getSaleProducts();
    res.status(200).json(products);
    console.log("Lấy thành công danh sách sản phẩm sale")
    console.log("======================================")
  } catch (err) {
    console.error("❌ Lỗi khi lấy sale products:", err.message);   // <-- in thông báo lỗi
    console.error("❌ Stack trace:", err.stack);                    // <-- in vết lỗi đầy đủ
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm khuyến mãi." });
  }
};

//============================= Gửi danh sách sản phẩm hot =============================
exports.getHotProductsHandler  = async (req, res) => {
  try {
    const product = await getHotProducts();

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    res.status(200).json(product);
    console.log("Lấy thành công danh sách sản phẩm hot")
    console.log("======================================")
  } catch (err) {
    console.error("Lỗi khi truy vấn sản phẩm theo ID:", err);
    res.status(500).json({ message: "Lỗi server." });
  }
};
// Handler để trả về toàn bộ danh sách category
exports.getCategoryHandler = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.status(200).json({
      data: categories,
      success: true,
    });
    console.log("Lấy thành công danh sách Categoty");
    console.log("======================================")
  } catch (error) {
    console.error("❌ Lỗi khi lấy categories:", error);
    res.status(500).json({
      success: false,
      message: "Lấy danh sách category thất bại!",
    });
  }
};
