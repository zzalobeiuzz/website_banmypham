const { connectDB, sql } = require("../config/connect");

const TABLE_NAME = "SUPPORT_REQUEST";

const ensureSupportRequestTable = async (pool) => {
  await pool.request().query(`
    IF OBJECT_ID(N'${TABLE_NAME}', N'U') IS NULL
    BEGIN
      CREATE TABLE [dbo].[${TABLE_NAME}](
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [full_name] NVARCHAR(255) NULL,
        [phone] NVARCHAR(50) NULL,
        [issue_type] NVARCHAR(100) NULL,
        [order_code] NVARCHAR(100) NULL,
        [message] NVARCHAR(MAX) NOT NULL,
        [is_read] BIT NOT NULL DEFAULT(0),
        [created_at] DATETIME NOT NULL DEFAULT(GETDATE()),
        [read_at] DATETIME NULL
      )
    END
  `);
};

const normalizeText = (value, maxLength = 1000) => {
  const text = String(value || "").trim();
  return text ? text.slice(0, maxLength) : null;
};

const mapRow = (row) => ({
  id: row.id,
  fullName: row.full_name || "",
  phone: row.phone || "",
  issueType: row.issue_type || "",
  orderCode: row.order_code || "",
  message: row.message || "",
  isRead: Boolean(row.is_read),
  createdAt: row.created_at,
  readAt: row.read_at,
});

exports.createSupportRequest = async (payload = {}) => {
  const fullName = normalizeText(payload.fullName, 255);
  const phone = normalizeText(payload.phone, 50);
  const issueType = normalizeText(payload.issueType, 100);
  const orderCode = normalizeText(payload.orderCode, 100);
  const message = normalizeText(payload.message, 4000);

  if (!message) {
    throw new Error("Vui lòng nhập nội dung cần hỗ trợ.");
  }

  const pool = await connectDB();
  await ensureSupportRequestTable(pool);

  const result = await pool.request()
    .input("FullName", sql.NVarChar(255), fullName)
    .input("Phone", sql.NVarChar(50), phone)
    .input("IssueType", sql.NVarChar(100), issueType)
    .input("OrderCode", sql.NVarChar(100), orderCode)
    .input("Message", sql.NVarChar(sql.MAX), message)
    .query(`
      INSERT INTO [${TABLE_NAME}] ([full_name], [phone], [issue_type], [order_code], [message])
      OUTPUT INSERTED.*
      VALUES (@FullName, @Phone, @IssueType, @OrderCode, @Message)
    `);

  return mapRow(result.recordset[0]);
};

exports.listSupportRequests = async ({ unreadOnly = false, limit = 30 } = {}) => {
  const pool = await connectDB();
  await ensureSupportRequestTable(pool);

  const result = await pool.request()
    .input("Limit", sql.Int, Math.max(1, Math.min(Number(limit) || 30, 500)))
    .query(`
      SELECT TOP (@Limit) *
      FROM [${TABLE_NAME}]
      ${unreadOnly ? "WHERE [is_read] = 0" : ""}
      ORDER BY [is_read] ASC, [created_at] DESC, [id] DESC
    `);

  return (result.recordset || []).map(mapRow);
};

exports.getUnreadSupportRequestCount = async () => {
  const pool = await connectDB();
  await ensureSupportRequestTable(pool);

  const result = await pool.request().query(`
    SELECT COUNT(1) AS unreadCount
    FROM [${TABLE_NAME}]
    WHERE [is_read] = 0
  `);

  return Number(result.recordset?.[0]?.unreadCount || 0);
};

exports.markSupportRequestRead = async (id) => {
  const pool = await connectDB();
  await ensureSupportRequestTable(pool);

  const result = await pool.request()
    .input("Id", sql.Int, Number(id))
    .query(`
      UPDATE [${TABLE_NAME}]
      SET [is_read] = 1,
          [read_at] = ISNULL([read_at], GETDATE())
      OUTPUT INSERTED.*
      WHERE [id] = @Id
    `);

  if (!result.recordset?.[0]) {
    throw new Error("Không tìm thấy yêu cầu hỗ trợ.");
  }

  return mapRow(result.recordset[0]);
};
