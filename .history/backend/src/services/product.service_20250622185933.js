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
  P.ProductID,         -- Lấy mã sản phẩm từ bảng PRODUCT
  P.ProductName,       -- Lấy tên sản phẩm
  P.SupplierID,        -- Lấy mã nhà cung cấp
  P.Price,             -- Lấy giá gốc sản phẩm
  P.Image,             -- Lấy ảnh sản phẩm
  P.isHot,             -- Lấy trạng thái "hot" (1 = sản phẩm hot)
  PS.sale_price        -- Lấy giá khuyến mãi từ bảng PRODUCT_SALE nếu có
FROM PRODUCT P
LEFT JOIN PRODUCT_SALE PS ON P.ProductID = PS.product_id  -- Ghép với bảng PRODUCT_SALE nếu có khuyến mãi
WHERE P.isHot = 1;     -- Chỉ chọn các sản phẩm có isHot = 1

`);

  return result.recordset.map(p => {
    return {
      ...p,
      //================Giữ dữ liệu thực thi hàm tính phần trăm 
      discountPercent: calculateDiscountPercent(p.Price, p.sale_price),
    }
  })
};
