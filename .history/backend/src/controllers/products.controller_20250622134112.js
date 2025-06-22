const { connectDB } = require("../config/connect");

// services/product.service.js
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
  // Tính toán phần trăm giảm giá cho mỗi sản phẩm và thêm vào đối tượng trả về
  return result.recordset.map(p => ({
    ...p, 
    // Sao chép toàn bộ thuộc tính gốc của sản phẩm (ProductName, Price, sale_price, v.v.)
    // Thêm thuộc tính mới là discountPercent
    // Công thức: ((giá gốc - giá khuyến mãi) / giá gốc) * 100
    // Math.round để làm tròn phần trăm
    discountPercent: Math.round(((p.Price - p.sale_price) / p.Price) * 100)
  }));
};


exports.getProductById = async (req, res) => {
  const { id } = req.params; // lấy param từ URL
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("id", id) // dùng input để tránh SQL injection
      .query(`SELECT * FROM PRODUCT WHERE ProductID = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error("Lỗi truy vấn theo ID:", err);
    res.status(500).json({ message: "Lỗi khi truy vấn sản phẩm." });
  }
};
