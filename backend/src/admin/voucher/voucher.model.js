const { connectDB } = require("../../config/connect");
const sql = require("mssql");

const TABLE_CANDIDATES = ["VOUCHERS", "VOUCHER"];

const pickColumn = (columns, candidates, fallback = null) => {
  const lowered = new Map(columns.map((column) => [String(column).toLowerCase(), column]));

  for (const candidate of candidates) {
    const found = lowered.get(String(candidate).toLowerCase());
    if (found) return found;
  }

  return fallback;
};

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

const resolveVoucherSchema = async (pool) => {
  for (const tableName of TABLE_CANDIDATES) {
    const columns = await getTableColumns(pool, tableName);
    if (!columns.length) continue;

    const schema = {
      tableName,
      voucherIdCol: pickColumn(columns, ["VoucherID", "Id", "ID"]),
      voucherCodeCol: pickColumn(columns, ["VoucherCode", "Code", "Voucher", "VoucherNo"]),
      titleCol: pickColumn(columns, ["Title", "Name", "VoucherName"]),
      detailCol: pickColumn(columns, ["Detail", "Description", "Content"]),
      discountAmountCol: pickColumn(columns, ["DiscountAmount", "DiscountValue", "Discount", "Value"]),
      minOrderAmountCol: pickColumn(columns, ["MinOrderAmount", "MinimumOrderAmount", "MinSubtotal", "MinValue"]),
      progressCol: pickColumn(columns, ["Progress", "UsageProgress", "UsedPercent"]),
      totalQuotaCol: pickColumn(columns, ["TotalQuota", "Quota", "Quantity", "Stock", "MaxClaims", "Limit"]),
      claimedCountCol: pickColumn(columns, ["ClaimedCount", "Claimed", "UsedCount", "RedeemedCount", "Used"]),
      isActiveCol: pickColumn(columns, ["IsActive", "isActive", "Status", "Active"]),
      publicCol: pickColumn(columns, ["IsPublic", "IsShared", "Public", "Shared", "IsPubliclyAvailable"]),
      startDateCol: pickColumn(columns, ["StartDate", "StartAt", "FromDate", "BeginDate"]),
      endDateCol: pickColumn(columns, ["EndDate", "EndAt", "ToDate", "ExpiredAt"]),
      createdAtCol: pickColumn(columns, ["CreatedAt", "createdAt", "CreateAt"]),
      updatedAtCol: pickColumn(columns, ["UpdatedAt", "updatedAt", "UpdateAt"]),
    };

    if (schema.voucherCodeCol || schema.titleCol || schema.detailCol) {
      return schema;
    }
  }

  throw new Error("Không tìm thấy bảng voucher trong cơ sở dữ liệu.");
};

const selectExpr = (columnName, alias) => (columnName ? `[${columnName}] AS [${alias}]` : `NULL AS [${alias}]`);

exports.getAllVouchers = async () => {
  const pool = await connectDB();
  const schema = await resolveVoucherSchema(pool);

  const orderByParts = [
    schema.isActiveCol ? `ISNULL([${schema.isActiveCol}], 1) DESC` : null,
    schema.createdAtCol ? `[${schema.createdAtCol}] DESC` : null,
    schema.voucherIdCol ? `[${schema.voucherIdCol}] DESC` : null,
  ].filter(Boolean);

  const orderBySql = orderByParts.length > 0 ? orderByParts.join(", ") : "1 DESC";

  // Determine orders table if we need to calculate redeemed count
  const userTables = await getUserTables(pool);
  const ORDER_TABLE_CANDIDATES = ["ORDERS", "ORDER", "[ORDER]", "SaleOrders", "SALES", "ORDERS_MAIN", "ORDERs"];
  const ordersTable = ORDER_TABLE_CANDIDATES.find((t) => userTables.includes(t)) || null;

  // Build select list
  const selectParts = [
    selectExpr(schema.voucherIdCol, "VoucherID"),
    selectExpr(schema.voucherCodeCol, "VoucherCode"),
    selectExpr(schema.titleCol, "Title"),
    selectExpr(schema.detailCol, "Detail"),
    selectExpr(schema.discountAmountCol, "DiscountAmount"),
    selectExpr(schema.minOrderAmountCol, "MinOrderAmount"),
    selectExpr(schema.progressCol, "Progress"),
    selectExpr(schema.isActiveCol, "IsActive"),
    selectExpr(schema.startDateCol, "StartDate"),
    selectExpr(schema.endDateCol, "EndDate"),
    selectExpr(schema.createdAtCol, "CreatedAt"),
    selectExpr(schema.updatedAtCol, "UpdatedAt"),
  ];

  // Add TotalQuota if present
  if (schema.totalQuotaCol) selectParts.push(selectExpr(schema.totalQuotaCol, "TotalQuota"));

  // Add IsPublic if present
  if (schema.publicCol) selectParts.push(selectExpr(schema.publicCol, "IsPublic"));

  // Add ClaimedCount column or placeholder (we'll compute if missing)
  let outerApplySql = null;
  if (schema.claimedCountCol) {
    selectParts.push(selectExpr(schema.claimedCountCol, "ClaimedCount"));
  } else if (ordersTable && schema.voucherCodeCol) {
    // We'll outer apply redeemed count from orders table
    selectParts.push("ISNULL(o.RedeemedCount, 0) AS [ClaimedCount]");
    outerApplySql = `OUTER APPLY (SELECT COUNT(1) AS RedeemedCount FROM [${ordersTable}] o WHERE o.[Voucher] = v.[${schema.voucherCodeCol}] AND (o.[Status] IN (N'Đã Thanh Toán', N'Thanh Toán COD') OR o.[Status] IS NULL)) o`;
  } else {
    selectParts.push("NULL AS [ClaimedCount]");
  }

  const result = await pool.request().query(`
    SELECT
      ${selectParts.join(",\n      ")}
    FROM [${schema.tableName}] v
    ${outerApplySql || ""}
    ORDER BY ${orderBySql}
  `);

  const rows = result.recordset || [];

  // Compute ProgressPct for each row if possible
  const normalized = rows.map((r) => {
    const total = r.TotalQuota == null ? null : Number(r.TotalQuota);
    const claimed = r.ClaimedCount == null ? 0 : Number(r.ClaimedCount);
    let pct = null;
    if (total != null && total > 0) {
      pct = Number(((claimed / total) * 100).toFixed(2));
    } else if (r.Progress != null) {
      pct = Number(Number(r.Progress).toFixed(2));
    }

    return {
      ...r,
      ClaimedCount: claimed,
      TotalQuota: total,
      ProgressPct: pct,
      IsPublic: r.IsPublic == null ? 'private' : String(r.IsPublic),
    };
  });

  return normalized;
};

exports.createVoucher = async (payload) => {
  const pool = await connectDB();
  const schema = await resolveVoucherSchema(pool);

  const columns = [];
  const values = [];
  const req = pool.request();

  const pushParam = (colName, paramName, type, value) => {
    if (!colName) return;
    columns.push(`[${colName}]`);
    values.push(`@${paramName}`);
    req.input(paramName, type, value);
  };

  const s = schema;

  pushParam(s.voucherCodeCol, "VoucherCode", sql.NVarChar(255), payload.VoucherCode || null);
  pushParam(s.titleCol, "Title", sql.NVarChar(400), payload.Title || null);
  pushParam(s.detailCol, "Detail", sql.NVarChar(2000), payload.Detail || null);
  pushParam(s.discountAmountCol, "DiscountAmount", sql.Decimal(18,2), payload.DiscountAmount || 0);
  pushParam(s.minOrderAmountCol, "MinOrderAmount", sql.Decimal(18,2), payload.MinOrderAmount || 0);
  pushParam(s.totalQuotaCol, "TotalQuota", sql.Int, payload.TotalQuota || 1);
  pushParam(s.progressCol, "Progress", sql.Decimal(5,2), payload.Progress || 0);
  pushParam(s.isActiveCol, "IsActive", sql.Int, payload.IsActive == 1 ? 1 : 0);
  // IsPublic stored as NVARCHAR (e.g. 'public' | 'private')
  pushParam(s.publicCol, "IsPublic", sql.NVarChar(50), payload.IsPublic ? String(payload.IsPublic) : 'private');
  pushParam(s.startDateCol, "StartDate", sql.Date, payload.StartDate ? new Date(payload.StartDate) : null);
  pushParam(s.endDateCol, "EndDate", sql.Date, payload.EndDate ? new Date(payload.EndDate) : null);

  if (columns.length === 0) {
    throw new Error("Bảng voucher không có cột hợp lệ để chèn.");
  }

  const insertSql = `INSERT INTO [${s.tableName}] (${columns.join(", ")}) OUTPUT INSERTED.* VALUES (${values.join(", ")})`;

  const result = await req.query(insertSql);
  return (result.recordset && result.recordset[0]) || null;
};

exports.updateVoucher = async (identifier, payload) => {
  const pool = await connectDB();
  const schema = await resolveVoucherSchema(pool);

  const keyCol = schema.voucherIdCol || schema.voucherCodeCol;
  if (!keyCol) {
    throw new Error("Bảng voucher không có cột định danh hợp lệ để cập nhật.");
  }

  const updates = [];
  const req = pool.request();

  const pushSet = (colName, paramName, type, value) => {
    if (!colName) return;
    updates.push(`[${colName}] = @${paramName}`);
    req.input(paramName, type, value);
  };

  req.input("Identifier", sql.NVarChar(255), String(identifier || "").trim());

  pushSet(schema.voucherCodeCol, "VoucherCode", sql.NVarChar(255), payload.VoucherCode || null);
  pushSet(schema.titleCol, "Title", sql.NVarChar(400), payload.Title || null);
  pushSet(schema.detailCol, "Detail", sql.NVarChar(2000), payload.Detail || null);
  pushSet(schema.discountAmountCol, "DiscountAmount", sql.Decimal(18,2), payload.DiscountAmount || 0);
  pushSet(schema.minOrderAmountCol, "MinOrderAmount", sql.Decimal(18,2), payload.MinOrderAmount || 0);
  pushSet(schema.totalQuotaCol, "TotalQuota", sql.Int, payload.TotalQuota || 1);
  pushSet(schema.progressCol, "Progress", sql.Decimal(5,2), payload.Progress || 0);
  pushSet(schema.isActiveCol, "IsActive", sql.Int, payload.IsActive == 1 ? 1 : 0);
  // Update IsPublic as string value
  pushSet(schema.publicCol, "IsPublic", sql.NVarChar(50), payload.IsPublic ? String(payload.IsPublic) : 'private');
  pushSet(schema.startDateCol, "StartDate", sql.Date, payload.StartDate ? new Date(payload.StartDate) : null);
  pushSet(schema.endDateCol, "EndDate", sql.Date, payload.EndDate ? new Date(payload.EndDate) : null);

  if (updates.length === 0) {
    throw new Error("Không có dữ liệu hợp lệ để cập nhật voucher.");
  }

  const updateSql = `
    UPDATE [${schema.tableName}]
    SET ${updates.join(", ")}
    OUTPUT INSERTED.*
    WHERE [${keyCol}] = @Identifier
  `;

  const result = await req.query(updateSql);
  if (!result.recordset || result.recordset.length === 0) {
    throw new Error("Không tìm thấy voucher để cập nhật.");
  }

  return result.recordset[0];
};

exports.deleteVoucher = async (identifier) => {
  const pool = await connectDB();
  const schema = await resolveVoucherSchema(pool);

  const keyCol = schema.voucherIdCol || schema.voucherCodeCol;
  if (!keyCol) {
    throw new Error("Bảng voucher không có cột định danh hợp lệ để xóa.");
  }

  const req = pool.request();
  req.input("Identifier", sql.NVarChar(255), String(identifier || "").trim());

  const deleteSql = `DELETE FROM [${schema.tableName}] WHERE [${keyCol}] = @Identifier`;
  const result = await req.query(deleteSql);

  if (!result.rowsAffected || !result.rowsAffected[0]) {
    throw new Error("Không tìm thấy voucher để xóa.");
  }

  return {
    deletedCount: result.rowsAffected?.[0] || 0,
  };
};

const getUserTables = async (pool) => {
  const r = await pool.request().query(`SELECT name FROM sys.objects WHERE type = 'U'`);
  return (r.recordset || []).map((r) => String(r.name));
};