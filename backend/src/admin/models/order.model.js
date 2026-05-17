const { connectDB } = require("../../config/connect");
const sql = require("mssql");

const ORDERS_TABLE = "ORDERS";
const ORDER_DETAILS_TABLE = "ORDER_DETAILS";

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const normalized = String(value).replace(/[^0-9.-]/g, "");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
};

const formatMoney = (value) => {
  const amount = toNumber(value);
  return `${Math.round(amount).toLocaleString("vi-VN")}₫`;
};

const pickColumn = (columns, candidates, fallback = null) => {
  const lowered = new Map(columns.map((col) => [String(col).toLowerCase(), col]));
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

const tableExists = async (pool, tableName) => {
  const result = await pool.request()
    .input("tableName", sql.NVarChar(128), tableName)
    .query(`SELECT OBJECT_ID(N'dbo.' + @tableName, N'U') AS TableId`);

  return Boolean(result.recordset?.[0]?.TableId);
};

exports.getAllOrdersFromBill = async () => {
  console.log("📥-------- Đang tải danh sách đơn hàng từ ORDERS -----------");
  const pool = await connectDB();

  const ordersSql = `
    SELECT
      CAST(O.[OrderID] AS NVARCHAR(100)) AS OrderId,
      CAST(O.[CustomerName] AS NVARCHAR(255)) AS CustomerName,
      CAST(O.[CustomerPhone] AS NVARCHAR(50)) AS CustomerPhone,
      CAST(O.[CustomerAddress] AS NVARCHAR(500)) AS CustomerAddress,
      CAST(O.[Status] AS NVARCHAR(100)) AS Status,
      CONVERT(VARCHAR(10), TRY_CAST(O.[CreatedAt] AS DATETIME), 23) AS OrderDate,
      CAST(O.[Total] AS DECIMAL(18,2)) AS TotalRaw
    FROM ${ORDERS_TABLE} O
    ORDER BY TRY_CAST(O.[CreatedAt] AS DATETIME) DESC, O.[OrderID] DESC
  `;

  const detailSql = `
    SELECT
      CAST(D.[OrderID] AS NVARCHAR(100)) AS OrderId,
      CAST(COALESCE(P.[ProductName], N'Sản phẩm') AS NVARCHAR(255)) AS ProductName,
      TRY_CAST(D.[Quantity] AS INT) AS Quantity,
      CAST(COALESCE(D.[SalePrice], D.[OriginalPrice]) AS DECIMAL(18,2)) AS UnitPriceRaw,
      CAST(D.[LineTotal] AS DECIMAL(18,2)) AS LineTotalRaw
    FROM ${ORDER_DETAILS_TABLE} D
    LEFT JOIN PRODUCT P ON CAST(P.[ProductID] AS NVARCHAR(100)) = CAST(D.[ProductID] AS NVARCHAR(100))
  `;

  const [orderRes, detailRes] = await Promise.all([
    pool.request().query(ordersSql),
    pool.request().query(detailSql),
  ]);

  const detailByOrder = (detailRes.recordset || []).reduce((acc, row) => {
    const orderId = String(row?.OrderId || "").trim();
    if (!orderId) return acc;

    const qty = Number(row?.Quantity || 0) || 0;
    const unitPrice = row?.UnitPriceRaw !== null && row?.UnitPriceRaw !== undefined
      ? toNumber(row.UnitPriceRaw)
      : (() => {
          const line = toNumber(row?.LineTotalRaw);
          if (!line || !qty) return 0;
          return line / qty;
        })();

    const item = {
      name: String(row?.ProductName || "Sản phẩm"),
      qty: qty || 1,
      price: formatMoney(unitPrice),
    };

    if (!acc[orderId]) acc[orderId] = [];
    acc[orderId].push(item);
    return acc;
  }, {});

  return (orderRes.recordset || []).map((row) => {
    const id = String(row?.OrderId || "");
    const details = detailByOrder[id] || [];

    const detailTotal = details.reduce((sum, item) => {
      const amount = toNumber(item.price);
      return sum + amount * (Number(item.qty) || 0);
    }, 0);

    const rawTotal = row?.TotalRaw !== null && row?.TotalRaw !== undefined ? toNumber(row.TotalRaw) : detailTotal;

    return {
      id,
      customer: String(row?.CustomerName || "Khách hàng"),
      date: String(row?.OrderDate || ""),
      total: formatMoney(rawTotal),
      status: String(row?.Status || "Đang xử lý"),
      details,
      address: String(row?.CustomerAddress || ""),
      phone: String(row?.CustomerPhone || ""),
    };
  });
};

exports.getOrderDetailFromBill = async (orderId) => {
  const safeOrderId = String(orderId || "").trim();
  if (!safeOrderId) {
    throw new Error("Thiếu mã đơn hàng.");
  }

  const pool = await connectDB();
  const detailSql = `
    SELECT
      CAST(O.[OrderID] AS NVARCHAR(100)) AS OrderId,
      CAST(O.[CustomerName] AS NVARCHAR(255)) AS CustomerName,
      CAST(O.[CustomerPhone] AS NVARCHAR(50)) AS CustomerPhone,
      CAST(O.[CustomerAddress] AS NVARCHAR(500)) AS CustomerAddress,
      CAST(O.[Status] AS NVARCHAR(100)) AS Status,
      CONVERT(VARCHAR(10), TRY_CAST(O.[CreatedAt] AS DATETIME), 23) AS OrderDate,
      CAST(O.[Total] AS DECIMAL(18,2)) AS TotalRaw,
      CAST(COALESCE(P.[ProductName], N'Sản phẩm') AS NVARCHAR(255)) AS ProductName,
      CAST(COALESCE(D.[ProductID], '') AS NVARCHAR(100)) AS ProductID,
      CAST(P.[Image] AS NVARCHAR(500)) AS ProductImage,
      TRY_CAST(D.[Quantity] AS INT) AS Quantity,
      CAST(D.[OriginalPrice] AS DECIMAL(18,2)) AS OriginalPriceRaw,
      CAST(D.[SalePrice] AS DECIMAL(18,2)) AS SalePriceRaw,
      CAST(COALESCE(D.[SalePrice], D.[OriginalPrice]) AS DECIMAL(18,2)) AS UnitPriceRaw,
      CAST(D.[LineTotal] AS DECIMAL(18,2)) AS LineTotalRaw,
      -- Inventory deduction (pick the first matching row if any)
      OID.BatchID AS DeductBatchID,
      OID.Barcode AS DeductBarcode,
      OID.DeductedQty AS DeductedQty,
      OID.ExpiryDate AS DeductExpiryDate
    FROM ${ORDERS_TABLE} O
    LEFT JOIN ${ORDER_DETAILS_TABLE} D ON CAST(D.[OrderID] AS NVARCHAR(100)) = CAST(O.[OrderID] AS NVARCHAR(100))
    LEFT JOIN PRODUCT P ON CAST(P.[ProductID] AS NVARCHAR(100)) = CAST(D.[ProductID] AS NVARCHAR(100))
    OUTER APPLY (
      SELECT TOP 1
        BatchID,
        Barcode,
        DeductedQty,
        ExpiryDate
      FROM ORDER_INVENTORY_DEDUCTION OID
      WHERE CAST(OID.OrderID AS NVARCHAR(100)) = CAST(O.OrderID AS NVARCHAR(100))
        AND CAST(OID.ProductID AS NVARCHAR(100)) = CAST(D.ProductID AS NVARCHAR(100))
      ORDER BY OID.ID ASC
    ) OID
    WHERE CAST(O.[OrderID] AS NVARCHAR(100)) = @orderId
  `;

  const result = await pool.request().input("orderId", sql.NVarChar(100), safeOrderId).query(detailSql);
  const rows = result.recordset || [];
  const row = rows[0];
  if (!row) return null;

  const details = rows
    .filter((item) => item?.ProductName || item?.Quantity)
    .map((detailRow) => {
      const qty = Number(detailRow?.Quantity || 0) || 0;
      const unitPrice = detailRow?.UnitPriceRaw !== null && detailRow?.UnitPriceRaw !== undefined
        ? toNumber(detailRow.UnitPriceRaw)
        : (() => {
            const line = toNumber(detailRow?.LineTotalRaw);
            if (!line || !qty) return 0;
            return line / qty;
          })();

      return {
        id: String(detailRow?.ProductID || ""),
        name: String(detailRow?.ProductName || "Sản phẩm"),
        qty: qty || 1,
        // formatted for display
        price: formatMoney(unitPrice),
        originalPrice: formatMoney(detailRow?.OriginalPriceRaw || 0),
        salePrice: formatMoney(detailRow?.SalePriceRaw || 0),
        lineTotal: formatMoney(detailRow?.LineTotalRaw || 0),
        // raw numeric values
        originalPriceRaw: Number(detailRow?.OriginalPriceRaw || 0) || 0,
        salePriceRaw: Number(detailRow?.SalePriceRaw || 0) || 0,
        lineTotalRaw: Number(detailRow?.LineTotalRaw || 0) || 0,
        image: detailRow?.ProductImage || "",
        batchId: detailRow?.DeductBatchID || null,
        barcode: detailRow?.DeductBarcode || "",
        deductedQty: Number(detailRow?.DeductedQty || 0) || 0,
        expiryDate: detailRow?.DeductExpiryDate ? String(detailRow.DeductExpiryDate) : "",
      };
    });

  const detailTotal = details.reduce((sum, item) => {
    const amount = toNumber(item.price);
    return sum + amount * (Number(item.qty) || 0);
  }, 0);

  const rawTotal = row?.TotalRaw !== null && row?.TotalRaw !== undefined ? toNumber(row.TotalRaw) : detailTotal;

  return {
    id: String(row?.OrderId || ""),
    customer: String(row?.CustomerName || "Khách hàng"),
    date: String(row?.OrderDate || ""),
    total: formatMoney(rawTotal),
    status: String(row?.Status || "Đang xử lý"),
    details,
    address: String(row?.CustomerAddress || ""),
    phone: String(row?.CustomerPhone || ""),
  };
};
