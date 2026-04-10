const { connectDB } = require("../../config/connect");
const sql = require("mssql");

const TOTAL_MONEY_EXPR = "TRY_CAST(REPLACE(REPLACE(O.TotalPrice, N'₫', ''), ',', '') AS DECIMAL(18,2))";

const getOrderTableName = async (pool) => {
  const tableCheck = await pool.request().query(`
    SELECT TOP 1
      CASE
        WHEN OBJECT_ID(N'dbo.[ORDER]', N'U') IS NOT NULL THEN N'dbo.[ORDER]'
        WHEN OBJECT_ID(N'dbo.ORDERS', N'U') IS NOT NULL THEN N'dbo.ORDERS'
        WHEN OBJECT_ID(N'dbo.[ORDERS]', N'U') IS NOT NULL THEN N'dbo.[ORDERS]'
        ELSE NULL
      END AS TableName
  `);

  return tableCheck.recordset[0]?.TableName || null;
};

/**
 * Lấy danh sách khách hàng từ CUSTOMER và ghép ACCOUNT theo Email nếu có
 */
exports.getCustomerList = async () => {
  try {
    const pool = await connectDB();
    const orderTableName = await getOrderTableName(pool);
    const orderStatsSql = orderTableName
      ? `OUTER APPLY (
          SELECT
            COUNT(*) AS OrderCount,
            SUM(${TOTAL_MONEY_EXPR}) AS TotalSpent
          FROM ${orderTableName} O
          WHERE O.Email = C.Email
        ) S`
      : `OUTER APPLY (
          SELECT
            CAST(0 AS INT) AS OrderCount,
            CAST(0 AS DECIMAL(18,2)) AS TotalSpent
        ) S`;

    const result = await pool.request().query(`
      SELECT
        C.Id AS CustomerCode,
        C.Email AS CustomerID,
        C.Email AS Email,
        C.Name AS FullName,
        C.Phone AS PhoneNumber,
        C.Address,
        CASE WHEN A.Email IS NULL THEN 'Customer' ELSE 'Account' END AS Type,
        A.Email AS AccountEmail,
        A.DisplayName,
        A.Avatar,
        A.Role,
        CASE WHEN A.Email IS NULL THEN 0 ELSE 1 END AS HasAccount,
        C.isActive AS IsActive,
        CASE
          WHEN A.Email IS NULL THEN N'Không có'
          ELSE N'Đã có'
        END AS AccountStatus,
        ISNULL(S.OrderCount, 0) AS OrderCount,
        ISNULL(S.TotalSpent, 0) AS TotalSpent
      FROM CUSTOMER C
      LEFT JOIN ACCOUNT A ON A.Email = C.Email
      ${orderStatsSql}
      WHERE ISNULL(C.isActive, 1) = 1
      ORDER BY C.Name ASC, C.Email ASC
    `);

    return result.recordset;
  } catch (error) {
    console.error("❌ Lỗi getCustomerList:", error.message);
    throw error;
  }
};

/**
 * Lấy chi tiết khách hàng + lịch sử đơn hàng + tổng tiền
 */
exports.getCustomerDetail = async (customerId) => {
  try {
    const pool = await connectDB();
    const orderTableName = await getOrderTableName(pool);

    const customerRes = await pool.request()
      .input("customerId", sql.VarChar, customerId)
      .query(`
        DECLARE @latestOrderDate DATE = NULL;
        ${orderTableName ? `SELECT @latestOrderDate = MAX(CreatedAt) FROM ${orderTableName} WHERE Email = @customerId;` : ""}

        SELECT
          C.Email AS CustomerID,
          C.Email AS Email,
          C.Id AS CustomerCode,
          C.Name AS FullName,
          C.Phone AS PhoneNumber,
          Address,
          CASE WHEN A.Email IS NULL THEN 'Customer' ELSE 'Account' END AS Type,
          A.Email AS AccountEmail,
          A.DisplayName,
          A.Avatar,
          A.Role,
          CONVERT(VARCHAR(10), @latestOrderDate, 23) AS LastOrderDate
        FROM CUSTOMER C
        LEFT JOIN ACCOUNT A ON A.Email = C.Email
        WHERE C.Email = @customerId
      `);

    const customer = customerRes.recordset[0];

    if (customer) {
      const ordersRes = orderTableName
        ? await pool.request()
            .input("email", sql.VarChar, customerId)
            .query(`
              SELECT TOP 100
                OrderID,
                OrderDate,
                TotalPrice,
                Status,
                CustomerName,
                CustomerPhone,
                CustomerAddress
              FROM ${orderTableName}
              WHERE Email = @email
              ORDER BY OrderDate DESC
            `)
        : { recordset: [] };

      const summaryRes = orderTableName
        ? await pool.request()
            .input("email", sql.VarChar, customerId)
            .query(`
              SELECT 
                COUNT(*) AS OrderCount,
                SUM(${TOTAL_MONEY_EXPR}) AS TotalSpent
              FROM ${orderTableName} O
              WHERE O.Email = @email
            `)
        : { recordset: [{ OrderCount: 0, TotalSpent: 0 }] };

      return {
        ...customer,
        Type: customer.AccountEmail ? "Account" : "Customer",
        Orders: ordersRes.recordset || [],
        OrderCount: summaryRes.recordset[0]?.OrderCount || 0,
        TotalSpent: summaryRes.recordset[0]?.TotalSpent || 0,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Lỗi getCustomerDetail:", error.message);
    throw error;
  }
};

/**
 * Xóa/vô hiệu hóa khách hàng (nếu có AccountID)
 */
exports.deleteCustomer = async (customerId) => {
  try {
    const pool = await connectDB();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const accountResult = await new sql.Request(transaction)
        .input("customerId", sql.VarChar, customerId)
        .query(`
          UPDATE ACCOUNT
          SET Role = -1
          WHERE Email = @customerId AND Role = 0
        `);

      await new sql.Request(transaction)
        .input("customerId", sql.VarChar, customerId)
        .query(`
          UPDATE CUSTOMER
          SET isActive = 0
          WHERE Email = @customerId
        `);

      await transaction.commit();
      return accountResult.rowsAffected[0] > 0;
    } catch (innerError) {
      await transaction.rollback();
      throw innerError;
    }
  } catch (error) {
    console.error("❌ Lỗi deleteCustomer:", error.message);
    throw error;
  }
};

/**
 * Reset mật khẩu tài khoản khách hàng theo email customerId
 */
exports.resetCustomerPassword = async (customerId, hashedPassword) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("customerId", sql.VarChar, customerId)
      .input("hashedPassword", sql.VarChar, hashedPassword)
      .query(`
        UPDATE ACCOUNT
        SET Password = @hashedPassword
        WHERE Email = @customerId
      `);

    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("❌ Lỗi resetCustomerPassword:", error.message);
    throw error;
  }
};

/**
 * Cập nhật thông tin khách hàng trong CUSTOMER
 */
exports.updateCustomerInfo = async ({ customerId, fullName, phoneNumber, address }) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("customerId", sql.VarChar, customerId)
      .input("fullName", sql.NVarChar, fullName)
      .input("phoneNumber", sql.VarChar, phoneNumber)
      .input("address", sql.NVarChar, address)
      .query(`
        UPDATE CUSTOMER
        SET
          Name = @fullName,
          Phone = @phoneNumber,
          Address = @address
        WHERE Email = @customerId
      `);

    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("❌ Lỗi updateCustomerInfo:", error.message);
    throw error;
  }
};

/**
 * Tạo mới khách hàng với đầy đủ hồ sơ CUSTOMER
 * và tùy chọn tạo ACCOUNT để đăng nhập thường / Google.
 */
exports.createCustomer = async ({
  email,
  fullName,
  phoneNumber,
  address,
  createAccount = false,
  hashedPassword = null,
  displayName = null,
  avatar = null,
}) => {
  try {
    const pool = await connectDB();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const checkReq = new sql.Request(transaction);
      const existsRes = await checkReq
        .input("email", sql.VarChar, email)
        .query(`
          SELECT TOP 1 1 AS ExistsCheck
          FROM (
            SELECT Email FROM CUSTOMER
            UNION
            SELECT Email FROM ACCOUNT
          ) E
          WHERE E.Email = @email
        `);

      if (existsRes.recordset.length > 0) {
        throw new Error("Email đã tồn tại.");
      }

      const customerReq = new sql.Request(transaction);
      await customerReq
        .input("name", sql.NVarChar, fullName)
        .input("email", sql.VarChar, email)
        .input("phone", sql.VarChar, phoneNumber)
        .input("address", sql.NVarChar, address)
        .query(`
          INSERT INTO CUSTOMER (Name, Email, Phone, Address, isActive)
          VALUES (@name, @email, @phone, @address, 1)
        `);

      if (createAccount) {
        const accountReq = new sql.Request(transaction);
        await accountReq
          .input("email", sql.VarChar, email)
          .input("password", sql.VarChar, hashedPassword)
          .input("displayName", sql.NVarChar, displayName || fullName)
          .input("avatar", sql.NVarChar, avatar || null)
          .query(`
            INSERT INTO ACCOUNT (Email, Password, DisplayName, Avatar, Role)
            VALUES (@email, @password, @displayName, @avatar, 0)
          `);
      }

      await transaction.commit();
      return true;
    } catch (innerError) {
      await transaction.rollback();
      throw innerError;
    }
  } catch (error) {
    console.error("❌ Lỗi createCustomer:", error.message);
    throw error;
  }
};
