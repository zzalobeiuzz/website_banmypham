// services/product.service.js
const { connectDB } = require("../config/connect");

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

  return result.recordset.map(p => ({
    ...p,
    discountPercent: Math.round(((p.Price - p.sale_price) / p.Price) * 100)
    discountDate:
  }));
};

// Lấy sản phẩm theo ID
exports.getProductByIdFromDB = async (id) => {
  const pool = await connectDB();
  const result = await pool
    .request()
    .input("id", id)
    .query(`SELECT * FROM PRODUCT WHERE ProductID = @id`);

  return result.recordset[0];
};
