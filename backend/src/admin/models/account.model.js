const { connectDB } = require("../../config/connect");
const sql = require("mssql");
const bcrypt = require("bcrypt");

exports.getAllAccounts = async () => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT *
      FROM ACCOUNT
      ORDER BY Email ASC
    `);

    return result.recordset || [];
  } catch (error) {
    console.error("❌ Lỗi getAllAccounts:", error.message);
    throw error;
  }
};

exports.resetAccountPassword = async ({ email, newPassword }) => {
  try {
    const pool = await connectDB();
    const hashedPassword = await bcrypt.hash(String(newPassword), 10);

    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .input("hashedPassword", sql.VarChar, hashedPassword)
      .query(`
        UPDATE ACCOUNT
        SET Password = @hashedPassword
        WHERE Email = @email
      `);

    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("❌ Lỗi resetAccountPassword:", error.message);
    throw error;
  }
};
