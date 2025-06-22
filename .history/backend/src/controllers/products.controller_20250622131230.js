const { connectDB } = require("../config/connect");

exports.getSaleProducts = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
    SELECT 
    P.ProductName,
    P.SupplierID,
    P.Price,
    P.
    PS.sale_price,
    PS.start_date,
    PS.end_date
  FROM PRODUCT_SALE PS
  JOIN PRODUCT P ON PS.product_id = P.ProductID;
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Lỗi truy vấn sản phẩm khuyến mãi:", err);
    res.status(500).json({ message: "Không thể lấy dữ liệu khuyến mãi." });
  }
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
