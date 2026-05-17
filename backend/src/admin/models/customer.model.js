const { connectDB } = require("../../config/connect");
const sql = require("mssql");

const TOTAL_MONEY_EXPR = "TRY_CAST(REPLACE(REPLACE(O.Total, N'₫', ''), ',', '') AS DECIMAL(18,2))";
const ORDER_TABLE = "ORDERS";

const pickColumn = (columns, candidates, fallback = null) => {
  const lowered = new Map(columns.map((column) => [String(column).toLowerCase(), column]));
  for (const candidate of candidates) {
    const found = lowered.get(String(candidate).toLowerCase());
    if (found) return found;
  }
  return fallback;
};

// Hàm kiểm tra xem bảng có tồn tại không
const getTableColumns = async (pool, tableName) => {
  const result = await pool.request()
    .input("tableName", sql.NVarChar(128), tableName)
    .query(`
      SELECT C.name AS ColumnName
      FROM sys.columns C
      INNER JOIN sys.objects O ON O.object_id = C.object_id
      WHERE O.type = 'U' AND O.name = @tableName
      ORDER BY C.column_id ASC
    `);

  return (result.recordset || []).map((row) => row.ColumnName);
};

const getCustomerSchema = async (pool) => {
  const customerCols = await getTableColumns(pool, "CUSTOMER");
  const customerKeyCol = pickColumn(customerCols, ["Email", "Id", "CustomerID", "CustomerCode"]);
  const customerCodeCol = pickColumn(customerCols, ["Id", "CustomerCode"], customerKeyCol);

  if (!customerKeyCol) {
    throw new Error("Không tìm thấy cột định danh của bảng CUSTOMER.");
  }

  return { customerKeyCol, customerCodeCol };
};

/**
 * Lấy danh sách khách hàng từ CUSTOMER và ghép ACCOUNT theo Email nếu có
 */
exports.getCustomerList = async () => {
  try {
    const pool = await connectDB();
    const { customerKeyCol, customerCodeCol } = await getCustomerSchema(pool);
    const orderStatsSql = `OUTER APPLY (
        SELECT
          COUNT(*) AS OrderCount,
          SUM(${TOTAL_MONEY_EXPR}) AS Total
        FROM ${ORDER_TABLE} O
        WHERE O.UserID = C.[${customerKeyCol}]
        AND O.Status IN (N'Thanh Toán COD', N'Đã Thanh Toán')
      ) S`;

    const result = await pool.request().query(`
      SELECT
        C.[${customerCodeCol}] AS CustomerCode,
        C.[${customerKeyCol}] AS CustomerID,
        C.[${customerKeyCol}] AS Email,
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
        ISNULL(S.Total, 0) AS Total
      FROM CUSTOMER C
      LEFT JOIN ACCOUNT A ON A.Email = C.[${customerKeyCol}]
      ${orderStatsSql}
      WHERE ISNULL(C.isActive, 1) = 1
      ORDER BY C.Name ASC, C.[${customerKeyCol}] ASC
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
    const { customerKeyCol, customerCodeCol } = await getCustomerSchema(pool);

    const customerRes = await pool.request()
      .input("customerId", sql.VarChar, customerId)
      .query(`
        DECLARE @latestOrderDate DATE = NULL;
        SELECT @latestOrderDate = MAX(CreatedAt) FROM ${ORDER_TABLE} WHERE UserID = @customerId;

        SELECT
          C.[${customerKeyCol}] AS CustomerID,
          C.[${customerKeyCol}] AS Email,
          C.[${customerCodeCol}] AS CustomerCode,
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
        LEFT JOIN ACCOUNT A ON A.Email = C.[${customerKeyCol}]
        WHERE C.[${customerKeyCol}] = @customerId
      `);

    const customer = customerRes.recordset[0];

    if (customer) {
      const ordersRes = await pool.request()
        .input("email", sql.VarChar, customerId)
        .query(`
          SELECT TOP 100
            OrderID,
            CreatedAt AS OrderDate,
            Total,
            Status,
            CustomerName,
            CustomerPhone,
            CustomerAddress
          FROM ${ORDER_TABLE}
          WHERE UserID = @email
          ORDER BY CreatedAt DESC
        `);

      const summaryRes = await pool.request()
        .input("email", sql.VarChar, customerId)
        .query(`
          SELECT 
            COUNT(*) AS OrderCount,
            SUM(${TOTAL_MONEY_EXPR}) AS Total
          FROM ${ORDER_TABLE} O
          WHERE O.UserID = @email
        `);

      return {
        ...customer,
        Type: customer.AccountEmail ? "Account" : "Customer",
        Orders: ordersRes.recordset || [],
        OrderCount: summaryRes.recordset[0]?.OrderCount || 0,
        Total: summaryRes.recordset[0]?.Total || 0,
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
    const { customerKeyCol } = await getCustomerSchema(pool);
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
          WHERE [${customerKeyCol}] = @customerId
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
    const { customerKeyCol } = await getCustomerSchema(pool);
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
        WHERE [${customerKeyCol}] = @customerId
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
    const { customerKeyCol } = await getCustomerSchema(pool);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const checkReq = new sql.Request(transaction);
      const existsRes = await checkReq
        .input("email", sql.VarChar, email)
        .query(`
          SELECT TOP 1 1 AS ExistsCheck
          FROM (
            SELECT [${customerKeyCol}] AS CustomerKey FROM CUSTOMER
            UNION
            SELECT Email FROM ACCOUNT
          ) E
          WHERE E.CustomerKey = @email
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
          INSERT INTO CUSTOMER (Name, [${customerKeyCol}], Phone, Address, isActive)
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
