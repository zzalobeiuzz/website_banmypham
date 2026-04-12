const { connectDB } = require("../../config/connect");
const sql = require("mssql");
const fs = require("fs");
const path = require("path");

const UPLOAD_ASSET_ROOT = path.join(__dirname, "../../../uploads/assets");

const normalizeAvatarValue = (avatar) => {
  const raw = String(avatar || "").trim();
  if (!raw) return null;

  // URL Facebook CDN thường rất dài, ưu tiên bỏ query string để giảm độ dài.
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      return `${parsed.origin}${parsed.pathname}`;
    } catch (error) {
      return raw.split("?")[0] || raw;
    }
  }

  return raw;
};

const resolveLocalAvatarDiskPath = (avatar) => {
  const raw = String(avatar || "").trim();
  if (!raw || /^https?:\/\//i.test(raw) || raw.startsWith("data:")) return "";

  const normalized = raw
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^uploads\/?assets\/?/i, "");

  if (!/^avatar\//i.test(normalized)) return "";
  return path.join(UPLOAD_ASSET_ROOT, normalized.replace(/\//g, path.sep));
};

const removePreviousAvatarFile = async ({ previousAvatar, nextAvatar }) => {
  const prev = String(previousAvatar || "").trim();
  const next = String(nextAvatar || "").trim();

  if (!prev || prev === next) return;

  const previousDiskPath = resolveLocalAvatarDiskPath(prev);
  if (!previousDiskPath) return;

  try {
    await fs.promises.unlink(previousDiskPath);
  } catch (error) {
    // Ignore file delete errors to avoid breaking avatar update flow.
  }
};

// 🔍 Lấy user theo email
exports.getUserByEmail = async (email) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT
          A.Email AS UserID,
          A.DisplayName,
          A.Email,
          A.Password,
          A.Role,
          A.Avatar,
          C.Name AS CustomerName,
          C.Phone AS PhoneNumber,
          C.Address
        FROM ACCOUNT A
        LEFT JOIN CUSTOMER C ON C.Email = A.Email
        WHERE A.Email = @email
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

// =========================== 📝 Tạo tài khoản mới =========================== 
exports.createUser = async (user) => {
  const {
    email,
    password,
    displayName,
    fullName,
    phoneNumber,
    address,
    avatar,
    role = 0,
  } = user;

  try {
    const pool = await connectDB();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const accountRequest = new sql.Request(transaction);
      await accountRequest
        .input("email", sql.VarChar, email)
        .input("password", sql.VarChar, password)
        .input("displayName", sql.NVarChar, displayName)
        .input("avatar", sql.NVarChar, normalizeAvatarValue(avatar))
        .input("role", sql.Int, role)
        .query(`
          INSERT INTO ACCOUNT (
            Email, Password, DisplayName, Avatar, Role
          )
          VALUES (
            @email, @password, @displayName, @avatar, @role
          )
        `);

      // Tạo hồ sơ CUSTOMER cho tài khoản người dùng thường
      if (role === 0) {
        const customerName = String(fullName || displayName || email.split("@")[0] || "Khách hàng").trim();
        const customerPhone = String(phoneNumber || "Chưa cập nhật").trim();
        const customerAddress = address ? String(address).trim() : null;

        const customerRequest = new sql.Request(transaction);
        await customerRequest
          .input("name", sql.NVarChar, customerName)
          .input("email", sql.VarChar, email)
          .input("phone", sql.VarChar, customerPhone)
          .input("address", sql.NVarChar, customerAddress)
          .query(`
            INSERT INTO CUSTOMER (Name, Email, Phone, Address, isActive)
            VALUES (@name, @email, @phone, @address, 1)
          `);
      }

      await transaction.commit();
    } catch (innerError) {
      await transaction.rollback();
      throw innerError;
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Lỗi tạo tài khoản createUser:", error.message);
    throw error;
  }
};
//=========================== 🔑 Đổi mật khẩu người dùng ===========================
exports.resetPass = async (email, newPassword) => {
  try {
    const pool = await connectDB();

    // Cập nhật mật khẩu
    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .input("password", sql.VarChar, newPassword)
      .query(`
        UPDATE ACCOUNT
        SET Password = @password
        WHERE Email = @email
      `);

    if (result.rowsAffected[0] === 0) {
      throw new Error("Không tìm thấy email này hoặc không cập nhật được mật khẩu");
    }

    return { success: true, message: "Đổi mật khẩu thành công" };
  } catch (error) {
    console.error("❌ Lỗi resetPass:", error.message);
    throw error;
  }
};

exports.updateAvatarByEmail = async (email, avatar) => {
  try {
    const pool = await connectDB();
    const normalizedAvatar = normalizeAvatarValue(avatar);

    const beforeRes = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT TOP 1 Avatar
        FROM ACCOUNT
        WHERE Email = @email
      `);
    const previousAvatar = beforeRes.recordset?.[0]?.Avatar || "";

    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .input("avatar", sql.NVarChar, normalizedAvatar)
      .query(`
        UPDATE ACCOUNT
        SET Avatar = @avatar
        WHERE Email = @email
      `);

    if (result.rowsAffected[0] === 0) {
      throw new Error("Khong tim thay tai khoan de cap nhat avatar");
    }

    await removePreviousAvatarFile({ previousAvatar, nextAvatar: normalizedAvatar });

    return { success: true, avatar: normalizedAvatar };
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    const canRetry = message.includes("would be truncated") && /^https?:\/\//i.test(String(avatar || ""));

    if (canRetry) {
      try {
        const pool = await connectDB();
        const tinyAvatar = String(avatar || "").split("?")[0];

        const beforeRes = await pool.request()
          .input("email", sql.VarChar, email)
          .query(`
            SELECT TOP 1 Avatar
            FROM ACCOUNT
            WHERE Email = @email
          `);
        const previousAvatar = beforeRes.recordset?.[0]?.Avatar || "";

        const retryResult = await pool.request()
          .input("email", sql.VarChar, email)
          .input("avatar", sql.NVarChar, tinyAvatar)
          .query(`
            UPDATE ACCOUNT
            SET Avatar = @avatar
            WHERE Email = @email
          `);

        if (retryResult.rowsAffected[0] > 0) {
            await removePreviousAvatarFile({ previousAvatar, nextAvatar: tinyAvatar });
          return { success: true, avatar: tinyAvatar };
        }
      } catch (retryError) {
        // Rơi xuống ném lỗi cũ bên dưới.
      }
    }

    console.error("❌ Lỗi updateAvatarByEmail:", error.message);
    throw error;
  }
};

exports.getUserProfileByEmail = async (email) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT
          A.Email,
          A.DisplayName,
          A.Avatar,
          A.Role,
          C.Name,
          C.Phone,
          C.Address
        FROM ACCOUNT A
        LEFT JOIN CUSTOMER C ON C.Email = A.Email
        WHERE A.Email = @email
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("❌ Lỗi getUserProfileByEmail:", error.message);
    throw error;
  }
};

exports.updateCustomerProfileByEmail = async ({ currentEmail, newEmail, name, phoneNumber, address }) => {
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const targetEmail = String(newEmail || currentEmail).trim().toLowerCase();
    const sourceEmail = String(currentEmail).trim().toLowerCase();

    if (!targetEmail) {
      throw new Error("Email không hợp lệ.");
    }

    if (targetEmail !== sourceEmail) {
      const checkReq = new sql.Request(transaction);
      const emailExists = await checkReq
        .input("targetEmail", sql.VarChar, targetEmail)
        .query(`
          SELECT TOP 1 1 AS existsCheck
          FROM (
            SELECT Email FROM ACCOUNT
            UNION
            SELECT Email FROM CUSTOMER
          ) E
          WHERE E.Email = @targetEmail
        `);

      if (emailExists.recordset.length > 0) {
        throw new Error("Email này đã tồn tại.");
      }
    }

    const accountReq = new sql.Request(transaction);
    await accountReq
      .input("sourceEmail", sql.VarChar, sourceEmail)
      .input("targetEmail", sql.VarChar, targetEmail)
      .query(`
        UPDATE ACCOUNT
        SET Email = @targetEmail
        WHERE Email = @sourceEmail
      `);

    const customerReq = new sql.Request(transaction);

    const existingCustomer = await customerReq
      .input("sourceEmail", sql.VarChar, sourceEmail)
      .query(`SELECT TOP 1 Id FROM CUSTOMER WHERE Email = @sourceEmail`);

    const finalName = name !== undefined ? String(name).trim() : null;
    const finalPhone = phoneNumber !== undefined ? String(phoneNumber).trim() : null;
    const finalAddress = address !== undefined ? String(address).trim() : null;

    if (existingCustomer.recordset.length > 0) {
      const updateReq = new sql.Request(transaction);
      await updateReq
        .input("sourceEmail", sql.VarChar, sourceEmail)
        .input("targetEmail", sql.VarChar, targetEmail)
        .input("name", sql.NVarChar, finalName)
        .input("phone", sql.VarChar, finalPhone)
        .input("address", sql.NVarChar, finalAddress)
        .query(`
          UPDATE CUSTOMER
          SET
            Email = @targetEmail,
            Name = COALESCE(@name, Name),
            Phone = COALESCE(@phone, Phone),
            Address = CASE WHEN @address IS NULL THEN Address ELSE @address END
          WHERE Email = @sourceEmail
        `);
    } else {
      const insertReq = new sql.Request(transaction);
      await insertReq
        .input("name", sql.NVarChar, finalName || "Khách hàng")
        .input("targetEmail", sql.VarChar, targetEmail)
        .input("phone", sql.VarChar, finalPhone || "Chưa cập nhật")
        .input("address", sql.NVarChar, finalAddress || null)
        .query(`
          INSERT INTO CUSTOMER (Name, Email, Phone, Address, isActive)
          VALUES (@name, @targetEmail, @phone, @address, 1)
        `);
    }

    await transaction.commit();
    return { success: true, email: targetEmail };
  } catch (error) {
    await transaction.rollback();
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("unique") || message.includes("duplicate") || message.includes("violat")) {
      throw new Error("Email này đã tồn tại.");
    }
    console.error("❌ Lỗi updateCustomerProfileByEmail:", error.message);
    throw error;
  }
};