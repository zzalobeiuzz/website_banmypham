const { connectDB } = require("../../config/connect");
const sql = require("mssql");

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
        .input("avatar", sql.NVarChar, avatar || null)
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
    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .input("avatar", sql.NVarChar, avatar)
      .query(`
        UPDATE ACCOUNT
        SET Avatar = @avatar
        WHERE Email = @email
      `);

    if (result.rowsAffected[0] === 0) {
      throw new Error("Khong tim thay tai khoan de cap nhat avatar");
    }

    return { success: true, avatar };
  } catch (error) {
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