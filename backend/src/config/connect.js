require("dotenv").config({ path: "../../private.env" });
const sql = require("mssql");

// Cấu hình kết nối
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
  },
};

// Global pool để tái sử dụng
let pool = null;

// Hàm kết nối
async function connectDB() {
  try {
    if (!pool || !pool.connected) {
      pool = new sql.ConnectionPool(config);
      await pool.connect();
      console.log("✅ Kết nối SQL Server thành công!");
    }
    return pool;
  } catch (err) {
    console.error("❌ Lỗi kết nối SQL Server:", err);
    throw err;
  }
}

module.exports = { connectDB, sql, config };
