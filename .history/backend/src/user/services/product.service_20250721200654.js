const {findSaleProducts,findHotProducts,findCategories,findAllProducts } = require("../models/product.model");
const { calculateDiscountPercent, calculateTimeLeft } = require("../utils/productUtils");

// ================================ LẤY DANH SÁCH SẢN PHẨM SALE ==============================
exports.getSaleProducts = async () => {
  const data = await findSaleProducts();
  return data.map(p => ({
    ...p,
    discountPercent: calculateDiscountPercent(p),
    discountTimeLeft: calculateTimeLeft(p.end_date),
  }));
};

// ================================ LẤY DANH SÁCH SẢN PHẨM HOT ==============================
exports.getHotProducts = async () => {
  const data = await findHotProducts();
  return data.map(p => ({
    ...p,
    discountPercent: calculateDiscountPercent(p),
  }));
};

// ================================ LẤY TẤT CẢ CATEGORY ==============================
exports.getAllCategories = async () => {
  try {
    
    const categories = await findCategories();
    return categories;
  } catch (error) {
    console.error("❌ Lỗi khi lấy categories:", error);
    throw error;
  }
};
// ================================ LẤY TẤT CẢ SẢN PHẨM ==============================
exports.getAllProducts = async () => {
  try {
    const data = await findAllProducts();

    // Nếu sản phẩm có trường giảm giá, thêm % giảm và thời gian còn lại (nếu cần)
    return data.map(p => ({
      ...p,
      discountPercent: p.sale_price ? calculateDiscountPercent(p) : 0,
      discountTimeLeft: p.end_date ? calculateTimeLeft(p.end_date) : null,
    }));
  } catch (error) {
    console.error("❌ Lỗi khi lấy tất cả sản phẩm:", error);
    throw error;
  }
};