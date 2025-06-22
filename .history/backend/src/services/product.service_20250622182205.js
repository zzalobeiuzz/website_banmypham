// services/product.service.js
const { connectDB } = require("../config/connect");
///utils/productUtils
const { formatDiscountProduct } = require("../utils/productUtils");

// Lấy danh sách sản phẩm khuyến mãi + tính % giảm giá
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
    const withDiscount = calculateDiscountPercent(p);
    const discountTimeLeft= calculateTimeLeft(withDiscount);
    return withTimeLeft;
  });
};

// Lấy danh sách sản phẩm Hot
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
  PS.start_date,
  PS.end_date
FROM PRODUCT P
LEFT JOIN PRODUCT_SALE PS ON P.ProductID = PS.product_id
WHERE P.isHot = 1
`);

return result.recordset.map(formatDiscountProduct);
};
