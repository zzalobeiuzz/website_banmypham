const { connectDB } = require("../config/connect.js");
const sql = require("mssql");

exports.getUserByEmail = async (email) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().input("email", email).query(`
        SELECT 
          DisplayName,
          Email,
          Password,
          Role
        FROM ACCOUNT
        WHERE Email = @email
      `);
    return result.recordset[0]; // lấy 1 dòng đầu tiên
  } catch (error) {
    console.error("❌ Lỗi truy vấn user:", error.message);
    throw error;
  }
};

exports.isEmailExist = async (email) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().input("email", sql.VarChar, email)
      .query(`
        SELECT 1 AS existsCheck
        FROM ACCOUNT
        WHERE Email = @email
      `);

    return result.recordset.length > 0; // true nếu tồn tại
  } catch (error) {
    console.error("❌ Lỗi kiểm tra email tồn tại:", error.message);
    throw error;
  }
};
