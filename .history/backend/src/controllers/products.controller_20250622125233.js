const { connectDB } = require("../config/connect");

exports.getAllProducts = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT * FROM PRODUCT
      WHERE CAST(CategoryID AS NVARCHAR(MAX)) = 'CHAMSOCCOTHE'
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Lỗi truy vấn:", err);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu." });
  }
};

exports.getProductById = async (req, res) => {
  const { id } = req.params; // lấy param từ URL
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input('id', id) // dùng input để tránh SQL injection
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

