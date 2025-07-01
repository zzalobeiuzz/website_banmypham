require("dotenv").config({ path: "./" });
const sql = require("mssql");

// Cấu hình kết nối
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",                // ⚡ Đọc từ env (true/false)
    trustServerCertificate: process.env.DB_TRUST_CERT === "true", // ⚡ Đọc từ env (true/false)
  },
};

// Hàm kết nối
async function connectDB() {
  try {
    let pool = await sql.connect(config);
    console.log("✅ Kết nối SQL Server thành công!");
    return pool;
  } catch (err) {
    console.error("❌ Lỗi kết nối SQL Server:", err);
    throw err;
  }
}

module.exports = { connectDB, sql, config };
