const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Bật CORS

// Middleware khác nếu cần (body-parser, logger,...)
app.use(express.json());

// Route test
app.get('/', (req, res) => {
  res.send('Server đang hoạt động!');
});

// Route API
app.get('/api/products', async (req, res) => {
  const { connectDB } = require('./config/connect');
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT * FROM PRODUCT
      WHERE CAST(CategoryID AS NVARCHAR(MAX)) = 'CHAMSOCCOTHE'
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi truy vấn:", err);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu." });
  }
});

module.exports = app;
