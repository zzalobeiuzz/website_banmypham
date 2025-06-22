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
    const endDate = new Date(p.end_date); // Ngày kết thúc khuyến mãi
    const today = new Date();             // Ngày hiện tại
    const timeDiff = endDate - today;     // Khoảng thời gian còn lại (ms)
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24))); // Số ngày còn lại
  
    return {
      ...p,
      discountPercent: Math.round(((p.Price - p.sale_price) / p.Price) * 100),
      discountDate: daysRemaining
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
