const { connectDB } = require("../config/connect.js");

exports.getUserByEmail = async (email) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("email", email)
      .query(`
        SELECT 
          UserID,
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
