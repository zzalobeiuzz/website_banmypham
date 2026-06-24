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

exports.updateAccount = async ({ email, displayName, avatar, role, isActive }) => {
  try {
    const pool = await connectDB();
    const columnsRes = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'ACCOUNT'
    `);

    const columns = new Set((columnsRes.recordset || []).map((row) => String(row.COLUMN_NAME || "").toLowerCase()));
    const request = pool.request().input("email", sql.VarChar, email);
    const updates = [];

    if (columns.has("displayname")) {
      request.input("displayName", sql.NVarChar, displayName || email);
      updates.push("DisplayName = @displayName");
    }

    if (columns.has("avatar")) {
      request.input("avatar", sql.NVarChar, avatar || "");
      updates.push("Avatar = @avatar");
    }

    if (columns.has("role")) {
      request.input("role", sql.Int, role);
      updates.push("Role = @role");
    }

    if (columns.has("isactive")) {
      request.input("isActive", sql.Bit, Number(isActive) === 1);
      updates.push("IsActive = @isActive");
    }

    if (columns.has("updatedat")) {
      updates.push("UpdatedAt = GETDATE()");
    }

    if (!updates.length) {
      throw new Error("Bang ACCOUNT khong co cot nao co the cap nhat.");
    }

    const result = await request.query(`
      UPDATE ACCOUNT
      SET ${updates.join(", ")}
      WHERE Email = @email
    `);

    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("❌ Lỗi updateAccount:", error.message);
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
