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
