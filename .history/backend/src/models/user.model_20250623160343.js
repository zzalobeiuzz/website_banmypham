const { connectDB } = require("../config/db"); // đảm bảo bạn có hàm connectDB

exports.getUserByEmailAndPassword = async (email, password) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("email", email)
      .input("password", password)
      .query(`
        SELECT 
          DisplayName,
          Email,
          Password,
          Role
        FROM ACCOUNT
        WHERE Email = @email AND Password = @password
      `);

    return result.recordset[0]; // Trả về user đầu tiên (nếu có)
  } catch (err) {
    console.error("❌ Lỗi khi truy vấn tài khoản:", err.message);
    throw err;
  }
};
