const { findSaleProducts, findHotProducts } = require("../models/product.model");
const { calculateDiscountPercent, calculateTimeLeft } = require("../utils/productUtils");


//================================LẤY DANH SÁCH SẢN PHẨM SALE==========================================
exports.getSaleProducts = async () => {
  const data = await findSaleProducts();
  return data.map(p => ({
    ...p,
    
    discountPercent: calculateDiscountPercent(p),
    discountTimeLeft: calculateTimeLeft(p.end_date),
  }));
};

//================================LẤY DANH SÁCH SẢN PHẨM HOT==========================================
exports.getHotProducts = async () => {
  const data = await findHotProducts();
  return data.map(p => ({
    ...p,
     //================Giữ dữ liệu thực thi hàm tính phần trăm 
    discountPercent: calculateDiscountPercent(p),
  }));
};
