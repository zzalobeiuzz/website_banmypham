// ============== khai báo file server
const { connectDB } = require("../config/connect");

///================= Khai báo các hàm trong productUtils để sử dụng
const {
  calculateDiscountPercent,
  calculateTimeLeft,
  formatDiscountProduct,
} = require("../utils/productUtils");

// ================================LẤY DANH SÁCH SẢN PHẨM KHUYẾN MÃI=========================
exports.getSaleProducts = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT 
      P.ProductName,
      P.SupplierID,
      P.Price,
      P.Image,
      PS.sale_price,
      PS.start_date,
      PS.end_date
    FROM PRODUCT_SALE PS
    JOIN PRODUCT P ON PS.product_id = P.ProductID;
  `);

  return result.recordset.map(p => {
    return {
      ...p,
      //================Giữ dữ liệu thực thi 2 hàm tính phần trăm + tính ngày còn lại khuyến mãi
      discountPercent: calculateDiscountPercent(p.Price, p.sale_price),
      discountTimeLeft: calculateTimeLeft(p.end_date),
    };
  });
};

//================================LẤY DANH SÁCH SẢN PHẨM HOT==========================================
exports.getHotProducts = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
  SELECT 
  P.ProductID,
  P.ProductName,
  P.SupplierID,
  P.Price,
  P.Image,
  P.isHot,
  PS.sale_price,
FROM PRODUCT P
LEFT JOIN PRODUCT_SALE PS ON P.ProductID = PS.product_id
WHERE P.isHot = 1
`);

  return result.recordset()
};
