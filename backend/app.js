const express = require('express');
const { connectDB, sql } = require('./connect');
const cors = require('cors');  // Đảm bảo CORS được bật

const app = express();
const port = 5000;
let a =1 ;
app.use(cors());  // Cho phép CORS

app.get('/api/products', async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .query(`
        SELECT TOP 3 *
        FROM PRODUCT
        WHERE CAST(CategoryID AS NVARCHAR(MAX)) = 'CHAMSOCCOTHE'
      `); 
    res.json(result.recordset);// Log dữ liệu trả về
  } catch (err) {
    console.error("Lỗi khi truy vấn dữ liệu:", err);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu từ cơ sở dữ liệu." });
  }
});


app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
