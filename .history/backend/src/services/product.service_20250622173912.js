// services/product.service.js
const { connectDB } = require("../config/connect");
///utils/productUtils
const { formatDiscountProduct } = require('../utils/productUtils');

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

  return result.recordset.map(formatDiscountProduct);
};

// Lấy danh sách sản phẩm Hot
exports.getHotProducts = async () => {
  const pool = await connectDB();
  const result = await pool
    .request().query(`SELECT * FROM PRODUCT WHERE ProductID = @id`);

  return result.recordset[0];
};
