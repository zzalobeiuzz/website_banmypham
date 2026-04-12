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

exports.createAccount = async ({ email, password, displayName, role = 0, avatar = "" }) => {
  try {
    const pool = await connectDB();

    const existsRes = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT TOP 1 Email
        FROM ACCOUNT
        WHERE Email = @email
      `);

    if (existsRes.recordset?.length > 0) {
      return { created: false, reason: "exists" };
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    await pool.request()
      .input("email", sql.VarChar, email)
      .input("hashedPassword", sql.VarChar, hashedPassword)
      .input("displayName", sql.NVarChar, displayName || email)
      .input("avatar", sql.NVarChar, avatar || "")
      .input("role", sql.Int, role)
      .query(`
        INSERT INTO ACCOUNT (Email, Password, DisplayName, Avatar, Role)
        VALUES (@email, @hashedPassword, @displayName, @avatar, @role)
      `);

    return { created: true };
  } catch (error) {
    console.error("❌ Lỗi createAccount:", error.message);
    throw error;
  }
};

exports.deleteAccount = async ({ email }) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`
        DELETE FROM ACCOUNT
        WHERE Email = @email
      `);

    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("❌ Lỗi deleteAccount:", error.message);
    throw error;
  }
};
