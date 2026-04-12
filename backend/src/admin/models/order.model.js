const { connectDB } = require("../../config/connect");
const sql = require("mssql");

const BILL_TABLE = "BILL";
const BILL_DETAIL_TABLE = "BILL_DETAIL";

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
  const pool = await connectDB();

  const hasBill = await tableExists(pool, BILL_TABLE);
  const hasBillDetail = await tableExists(pool, BILL_DETAIL_TABLE);

  if (!hasBill || !hasBillDetail) {
    throw new Error("Không tìm thấy bảng BILL hoặc BILL_DETAIL trong cơ sở dữ liệu.");
  }

  const billCols = await getTableColumns(pool, BILL_TABLE);
  const detailCols = await getTableColumns(pool, BILL_DETAIL_TABLE);

  const billIdCol = pickColumn(billCols, ["BillID", "OrderID", "ID", "idBill", "BillId"]);
  const billDateCol = pickColumn(billCols, ["OrderDate", "BillDate", "CreatedAt", "CreatedDate", "DateCreated"]);
  const billStatusCol = pickColumn(billCols, ["Status", "OrderStatus", "BillStatus"], null);
  const billTotalCol = pickColumn(billCols, ["TotalPrice", "TotalAmount", "Total", "Amount", "GrandTotal"], null);
  const customerNameCol = pickColumn(billCols, ["CustomerName", "FullName", "Name", "CustomerFullName"], null);
  const customerPhoneCol = pickColumn(billCols, ["CustomerPhone", "Phone", "PhoneNumber", "Mobile"], null);
  const customerAddressCol = pickColumn(billCols, ["CustomerAddress", "Address", "ShippingAddress"], null);

  const detailBillIdCol = pickColumn(detailCols, ["BillID", "OrderID", "idBill", "BillId"]);
  const detailProductIdCol = pickColumn(detailCols, ["ProductID", "ProductId", "IDProduct"], null);
  const detailProductNameCol = pickColumn(detailCols, ["ProductName", "Name"], null);
  const detailQtyCol = pickColumn(detailCols, ["Quantity", "Qty", "SoLuong"], null);
  const detailUnitPriceCol = pickColumn(detailCols, ["UnitPrice", "Price", "DonGia"], null);
  const detailLineTotalCol = pickColumn(detailCols, ["TotalPrice", "Amount", "ThanhTien", "LineTotal"], null);

  if (!billIdCol || !detailBillIdCol) {
    throw new Error("Thiếu cột khóa liên kết BILL/BILL_DETAIL (BillID/OrderID).");
  }

  const productTableExists = await tableExists(pool, "PRODUCT");
  const productCols = productTableExists ? await getTableColumns(pool, "PRODUCT") : [];
  const productIdCol = productTableExists ? pickColumn(productCols, ["ProductID", "ProductId", "ID"]) : null;
  const productNameCol = productTableExists ? pickColumn(productCols, ["ProductName", "Name"]) : null;

  const billSql = `
    SELECT
      CAST(B.[${billIdCol}] AS NVARCHAR(100)) AS OrderId,
      ${customerNameCol ? `CAST(B.[${customerNameCol}] AS NVARCHAR(255))` : "NULL"} AS CustomerName,
      ${customerPhoneCol ? `CAST(B.[${customerPhoneCol}] AS NVARCHAR(100))` : "NULL"} AS CustomerPhone,
      ${customerAddressCol ? `CAST(B.[${customerAddressCol}] AS NVARCHAR(500))` : "NULL"} AS CustomerAddress,
      ${billStatusCol ? `CAST(B.[${billStatusCol}] AS NVARCHAR(100))` : "N'Đang xử lý'"} AS Status,
      ${billDateCol ? `CONVERT(VARCHAR(10), TRY_CAST(B.[${billDateCol}] AS DATETIME), 23)` : "NULL"} AS OrderDate,
      ${billTotalCol ? `CAST(B.[${billTotalCol}] AS NVARCHAR(100))` : "NULL"} AS TotalRaw
    FROM ${BILL_TABLE} B
    ORDER BY ${billDateCol ? `TRY_CAST(B.[${billDateCol}] AS DATETIME) DESC` : `B.[${billIdCol}] DESC`}
  `;

  const detailSql = `
    SELECT
      CAST(D.[${detailBillIdCol}] AS NVARCHAR(100)) AS OrderId,
      ${productTableExists && detailProductIdCol && productIdCol && productNameCol
        ? `CAST(COALESCE(P.[${productNameCol}], ${detailProductNameCol ? `D.[${detailProductNameCol}]` : "NULL"}, N'Sản phẩm') AS NVARCHAR(255))`
        : detailProductNameCol
          ? `CAST(COALESCE(D.[${detailProductNameCol}], N'Sản phẩm') AS NVARCHAR(255))`
          : "N'Sản phẩm'"} AS ProductName,
      ${detailQtyCol ? `TRY_CAST(D.[${detailQtyCol}] AS INT)` : "1"} AS Quantity,
      ${detailUnitPriceCol ? `CAST(D.[${detailUnitPriceCol}] AS NVARCHAR(100))` : "NULL"} AS UnitPriceRaw,
      ${detailLineTotalCol ? `CAST(D.[${detailLineTotalCol}] AS NVARCHAR(100))` : "NULL"} AS LineTotalRaw
    FROM ${BILL_DETAIL_TABLE} D
    ${productTableExists && detailProductIdCol && productIdCol
      ? `LEFT JOIN PRODUCT P ON CAST(P.[${productIdCol}] AS NVARCHAR(100)) = CAST(D.[${detailProductIdCol}] AS NVARCHAR(100))`
      : ""}
  `;

  const [billRes, detailRes] = await Promise.all([
    pool.request().query(billSql),
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

  return (billRes.recordset || []).map((row) => {
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
