const { connectDB } = require("../config/connect");
const sql = require("mssql");

// 🔍 Lấy user theo email
exports.getUserByEmail = async (email) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT 
          DisplayName,
          Email,
          Password,
          Role
        FROM ACCOUNT
        WHERE Email = @email
      `);
    return result.recordset[0] || null;
  } catch (error) {
    console.error("❌ Lỗi truy vấn getUserByEmail:", error.message);
    throw error;
  }
};

// ✅ Kiểm tra email đã tồn tại
exports.isEmailExist = async (email) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT 1 AS existsCheck
        FROM ACCOUNT
        WHERE Email = @email
      `);
    return result.recordset.length > 0;
  } catch (error) {
    console.error("❌ Lỗi kiểm tra isEmailExist:", error.message);
    throw error;
  }
};

// 📝 Tạo tài khoản mới
exports.createUser = async (user) => {
  const {
    email,
    password,
    displayName,
    fullName,
    phoneNumber,
    address,
    role = 0,
  } = user;

  try {
    const pool = await connectDB();
    await pool.request()
      .input("email", sql.VarChar, email)
      .input("password", sql.VarChar, password)
      .input("displayName", sql.NVarChar, displayName)
      .input("fullName", sql.NVarChar, fullName || null)
      .input("phoneNumber", sql.VarChar, phoneNumber || null)
      .input("address", sql.NVarChar, address || null)
      .input("role", sql.Int, role)
      .query(`
        INSERT INTO ACCOUNT (
          Email, Password, DisplayName, FullName, PhoneNumber, Address, Role, CreatedAt
        )
        VALUES (
          @email, @password, @displayName, @fullName, @phoneNumber, @address, @role, GETDATE()
        )
      `);
    return { success: true };
  } catch (error) {
    console.error("❌ Lỗi tạo tài khoản createUser:", error.message);
    throw error;
  }
};
