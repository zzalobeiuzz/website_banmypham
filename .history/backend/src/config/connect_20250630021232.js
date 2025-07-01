const sql = require('mssql');

// Cấu hình kết nối
const config = {
  user: 'ChuTich',
  password: '1',
  server: 'localhost',  // Thử localhost thay vì tên máy chủ
  database: 'QLMP',
  options: {
    encrypt: false,                  // Mã hóa dữ liệu nhận về 
    trustServerCertificate: true,     // Bỏ qua chứng chỉ SSL tự ký
  },
  port: 1433,  // Cổng mặc định
};


// Hàm kết nối
async function connectDB() {
  try {
    // Kết nối đến SQL Server
    let pool = await sql.connect(config);
    console.log("Kết nối SQL Server thành công!");
    return pool;
  } catch (err) {
    console.error("Lỗi kết nối:", err);
    throw err;
  }
}

module.exports = { connectDB, sql };
