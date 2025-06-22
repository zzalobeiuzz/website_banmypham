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

  return result.recordset.map(p => {
    const endDate = new Date(p.end_date);
    const now = new Date();
    const diffMs = endDate - now;
  
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000)); // Tổng số giây còn lại, không âm
  
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    return {
      ...p,
      discountPercent: Math.round(((p.Price - p.sale_price) / p.Price) * 100),
      discountTimeLeft:`Còn ${days} ngày ${hours}:${minutes}:${seconds}s`
    };
  });
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
