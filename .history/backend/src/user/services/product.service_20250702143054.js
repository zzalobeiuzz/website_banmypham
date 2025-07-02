const {findSaleProducts,findHotProducts,findCategories} = require("../models/product.model");
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
    categories.forEach((category) => {
      console.log(category.SubCategories);
    });
    return categories;
  } catch (error) {
    console.error("❌ Lỗi khi lấy categories:", error);
    throw error;
  }
};
