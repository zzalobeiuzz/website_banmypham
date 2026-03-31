const sql = require("mssql");
const { connectDB } = require("../../config/connect");

const BATCH_TABLE = "BATCHES";

exports.syncExpiredBatchDetailsStatus = async () => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      DECLARE @expiryColumn SYSNAME = NULL;

      IF COL_LENGTH('BATCH_DETAIL', 'ExpiryDate') IS NOT NULL SET @expiryColumn = 'ExpiryDate';
      ELSE IF COL_LENGTH('BATCH_DETAIL', 'ExpiredDate') IS NOT NULL SET @expiryColumn = 'ExpiredDate';
      ELSE IF COL_LENGTH('BATCH_DETAIL', 'ExpireDate') IS NOT NULL SET @expiryColumn = 'ExpireDate';

      IF @expiryColumn IS NULL OR COL_LENGTH('BATCH_DETAIL', 'IsActive') IS NULL
      BEGIN
        SELECT 0 AS UpdatedRows;
        RETURN;
      END

      DECLARE @sql NVARCHAR(MAX) = N'
        UPDATE BD
        SET BD.IsActive = 0
        FROM BATCH_DETAIL BD
        WHERE ISNULL(BD.IsActive, 1) = 1
          AND BD.' + QUOTENAME(@expiryColumn) + N' IS NOT NULL
          AND CAST(BD.' + QUOTENAME(@expiryColumn) + N' AS DATE) < CAST(GETDATE() AS DATE);

        SELECT @@ROWCOUNT AS UpdatedRows;
      ';

      EXEC sp_executesql @sql;
    `);

    return Number(result.recordset?.[0]?.UpdatedRows || 0);
  } catch (error) {
    console.error("❌ Lỗi đồng bộ lô hết hạn trong batch.model:", error.message);
    return 0;
  }
};

exports.findAllBatches = async () => {
  const pool = await connectDB();

  const result = await pool.request().query(`
    SELECT ID, CreatedAt, Note, IsActive
    FROM ${BATCH_TABLE}
    WHERE IsActive = 1 OR IsActive IS NULL
    ORDER BY CreatedAt DESC
  `);

  return result.recordset;
};

exports.createBatch = async (batchId, note = "") => {
  const pool = await connectDB();

  const result = await pool.request()
    .input("ID", sql.NVarChar(100), batchId)
    .input("CreatedAt", sql.DateTime, new Date())
    .input("Note", sql.NVarChar(255), note || "")
    .query(`
      INSERT INTO ${BATCH_TABLE} (ID, CreatedAt, Note)
      VALUES (@ID, @CreatedAt, @Note);

      SELECT ID, CreatedAt, Note
      FROM ${BATCH_TABLE}
      WHERE ID = @ID
    `);

  return result.recordset?.[0] || null;
};

exports.findProductsByBatchId = async (batchId) => {
  const pool = await connectDB();

  const result = await pool.request()
    .input("BatchID", sql.NVarChar(100), String(batchId || "").trim())
    .query(`
      SELECT
        BD.ProductID,
        P.ProductName,
        BD.Barcode,
        BD.Quantity,
        BD.CreatedAt,
        BD.ExpiryDate,
        ISNULL(BD.IsActive, 1) AS IsActive
      FROM BATCH_DETAIL BD
      LEFT JOIN PRODUCT P ON P.ProductID = BD.ProductID
      WHERE CAST(BD.BatchID AS NVARCHAR(100)) = @BatchID
      ORDER BY BD.CreatedAt DESC, BD.ProductID ASC
    `);

  return result.recordset || [];
};

exports.updateBatch = async ({ oldBatchId, newBatchId, note = "" }) => {
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const oldId = String(oldBatchId || "").trim();
    const nextId = String(newBatchId || "").trim();

    if (!oldId || !nextId) {
      await transaction.rollback();
      return null;
    }

    const existing = await new sql.Request(transaction)
      .input("OldBatchID", sql.NVarChar(100), oldId)
      .query(`
        SELECT TOP 1 ID
        FROM ${BATCH_TABLE}
        WHERE CAST(ID AS NVARCHAR(100)) = @OldBatchID
      `);

    if (!existing.recordset?.length) {
      await transaction.rollback();
      return null;
    }

    if (oldId !== nextId) {
      const duplicate = await new sql.Request(transaction)
        .input("NewBatchID", sql.NVarChar(100), nextId)
        .query(`
          SELECT TOP 1 ID
          FROM ${BATCH_TABLE}
          WHERE CAST(ID AS NVARCHAR(100)) = @NewBatchID
        `);

      if (duplicate.recordset?.length) {
        await transaction.rollback();
        return { duplicated: true };
      }

      await new sql.Request(transaction)
        .input("OldBatchID", sql.NVarChar(100), oldId)
        .input("NewBatchID", sql.NVarChar(100), nextId)
        .query(`
          UPDATE BATCH_DETAIL
          SET BatchID = @NewBatchID
          WHERE CAST(BatchID AS NVARCHAR(100)) = @OldBatchID
        `);
    }

    await new sql.Request(transaction)
      .input("OldBatchID", sql.NVarChar(100), oldId)
      .input("NewBatchID", sql.NVarChar(100), nextId)
      .input("BatchNote", sql.NVarChar(255), String(note || ""))
      .query(`
        UPDATE ${BATCH_TABLE}
        SET ID = @NewBatchID,
            Note = @BatchNote
        WHERE CAST(ID AS NVARCHAR(100)) = @OldBatchID
      `);

    const updated = await new sql.Request(transaction)
      .input("BatchID", sql.NVarChar(100), nextId)
      .query(`
        SELECT TOP 1 ID, CreatedAt, Note
        FROM ${BATCH_TABLE}
        WHERE CAST(ID AS NVARCHAR(100)) = @BatchID
      `);

    await transaction.commit();
    return updated.recordset?.[0] || null;
  } catch (error) {
    if (transaction._aborted !== true) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error("❌ Rollback update batch thất bại:", rollbackErr.message);
      }
    }
    throw error;
  }
};

exports.countProductsByBatchId = async (batchId) => {
  const pool = await connectDB();

  const result = await pool.request()
    .input("BatchID", sql.NVarChar(100), String(batchId || "").trim())
    .query(`
      SELECT COUNT(1) AS Total
      FROM BATCH_DETAIL
      WHERE CAST(BatchID AS NVARCHAR(100)) = @BatchID
    `);

  return Number(result.recordset?.[0]?.Total || 0);
};

exports.deleteBatch = async (batchId) => {
  const pool = await connectDB();

  await pool.request()
    .input("BatchID", sql.NVarChar(100), String(batchId || "").trim())
    .query(`
      UPDATE ${BATCH_TABLE}
      SET IsActive = 0
      WHERE CAST(ID AS NVARCHAR(100)) = @BatchID
    `);
};

exports.findBatchById = async (batchId) => {
  const pool = await connectDB();

  const result = await pool.request()
    .input("BatchID", sql.NVarChar(100), String(batchId || "").trim())
    .query(`
      SELECT TOP 1 ID, CreatedAt, Note
      FROM ${BATCH_TABLE}
      WHERE CAST(ID AS NVARCHAR(100)) = @BatchID
    `);

  return result.recordset?.[0] || null;
};

exports.findProductById = async (productId) => {
  const pool = await connectDB();

  const result = await pool.request()
    .input("ProductID", sql.NVarChar(100), String(productId || "").trim())
    .query(`
      SELECT TOP 1 ProductID, ProductName, IsHidden
      FROM PRODUCT
      WHERE CAST(ProductID AS NVARCHAR(100)) = @ProductID
    `);

  return result.recordset?.[0] || null;
};

exports.findBatchDetailByBarcode = async (barcode) => {
  const pool = await connectDB();

  const result = await pool.request()
    .input("Barcode", sql.NVarChar(100), String(barcode || "").trim())
    .query(`
      SELECT TOP 1 BatchID, ProductID, Barcode
      FROM BATCH_DETAIL
      WHERE CAST(Barcode AS NVARCHAR(100)) = @Barcode
    `);

  return result.recordset?.[0] || null;
};

exports.addProductToBatch = async ({
  batchId,
  productId,
  barcode,
  quantity,
  isActive,
}) => {
  const pool = await connectDB();

  const meta = await pool.request().query(`
    SELECT
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'BatchID') IS NOT NULL THEN 'BatchID'
        WHEN COL_LENGTH('BATCH_DETAIL', 'BatchId') IS NOT NULL THEN 'BatchId'
        WHEN COL_LENGTH('BATCH_DETAIL', 'IDBatch') IS NOT NULL THEN 'IDBatch'
        ELSE NULL
      END AS BatchColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'ProductID') IS NOT NULL THEN 'ProductID'
        WHEN COL_LENGTH('BATCH_DETAIL', 'ProductId') IS NOT NULL THEN 'ProductId'
        ELSE NULL
      END AS ProductColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'Barcode') IS NOT NULL THEN 'Barcode'
        WHEN COL_LENGTH('BATCH_DETAIL', 'BatchBarcode') IS NOT NULL THEN 'BatchBarcode'
        WHEN COL_LENGTH('BATCH_DETAIL', 'BarCode') IS NOT NULL THEN 'BarCode'
        WHEN COL_LENGTH('BATCH_DETAIL', 'Code') IS NOT NULL THEN 'Code'
        ELSE NULL
      END AS BarcodeColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'Quantity') IS NOT NULL THEN 'Quantity'
        WHEN COL_LENGTH('BATCH_DETAIL', 'StockQuantity') IS NOT NULL THEN 'StockQuantity'
        ELSE NULL
      END AS QuantityColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'IsActive') IS NOT NULL THEN 'IsActive'
        WHEN COL_LENGTH('BATCH_DETAIL', 'isActive') IS NOT NULL THEN 'isActive'
        ELSE NULL
      END AS ActiveColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'CreatedAt') IS NOT NULL THEN 'CreatedAt'
        ELSE NULL
      END AS CreatedAtColumn
  `);

  const row = meta.recordset?.[0] || {};
  if (!row.BatchColumn || !row.ProductColumn || !row.BarcodeColumn || !row.QuantityColumn || !row.ActiveColumn) {
    return 0;
  }

  const columns = [
    `[${row.BatchColumn}]`,
    `[${row.ProductColumn}]`,
    `[${row.BarcodeColumn}]`,
    `[${row.QuantityColumn}]`,
    `[${row.ActiveColumn}]`,
  ];
  const values = ["@BatchID", "@ProductID", "@Barcode", "@Quantity", "@IsActive"];

  if (row.CreatedAtColumn) {
    columns.push(`[${row.CreatedAtColumn}]`);
    values.push("GETDATE()");
  }

  const result = await pool.request()
    .input("BatchID", sql.NVarChar(100), String(batchId || "").trim())
    .input("ProductID", sql.NVarChar(100), String(productId || "").trim())
    .input("Barcode", sql.NVarChar(100), String(barcode || "").trim())
    .input("Quantity", sql.Int, Number(quantity || 0))
    .input("IsActive", sql.Bit, Number(isActive || 0) === 1 ? 1 : 0)
    .query(`
      INSERT INTO BATCH_DETAIL (${columns.join(", ")})
      VALUES (${values.join(", ")});

      SELECT @@ROWCOUNT AS InsertedRows;
    `);

  return Number(result.recordset?.[0]?.InsertedRows || 0);
};

exports.updateProductInBatch = async ({
  batchId,
  productId,
  oldBarcode,
  newBarcode,
  quantity,
  isActive,
}) => {
  const pool = await connectDB();

  const meta = await pool.request().query(`
    SELECT
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'BatchID') IS NOT NULL THEN 'BatchID'
        WHEN COL_LENGTH('BATCH_DETAIL', 'BatchId') IS NOT NULL THEN 'BatchId'
        WHEN COL_LENGTH('BATCH_DETAIL', 'IDBatch') IS NOT NULL THEN 'IDBatch'
        ELSE NULL
      END AS BatchColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'ProductID') IS NOT NULL THEN 'ProductID'
        WHEN COL_LENGTH('BATCH_DETAIL', 'ProductId') IS NOT NULL THEN 'ProductId'
        ELSE NULL
      END AS ProductColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'Barcode') IS NOT NULL THEN 'Barcode'
        WHEN COL_LENGTH('BATCH_DETAIL', 'BatchBarcode') IS NOT NULL THEN 'BatchBarcode'
        WHEN COL_LENGTH('BATCH_DETAIL', 'BarCode') IS NOT NULL THEN 'BarCode'
        WHEN COL_LENGTH('BATCH_DETAIL', 'Code') IS NOT NULL THEN 'Code'
        ELSE NULL
      END AS BarcodeColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'Quantity') IS NOT NULL THEN 'Quantity'
        WHEN COL_LENGTH('BATCH_DETAIL', 'StockQuantity') IS NOT NULL THEN 'StockQuantity'
        ELSE NULL
      END AS QuantityColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'IsActive') IS NOT NULL THEN 'IsActive'
        WHEN COL_LENGTH('BATCH_DETAIL', 'isActive') IS NOT NULL THEN 'isActive'
        ELSE NULL
      END AS ActiveColumn
  `);

  const row = meta.recordset?.[0] || {};
  if (!row.BatchColumn || !row.ProductColumn || !row.QuantityColumn || !row.BarcodeColumn || !row.ActiveColumn) {
    return 0;
  }

  const whereParts = [
    `CAST([${row.BatchColumn}] AS NVARCHAR(100)) = @BatchID`,
    `CAST([${row.ProductColumn}] AS NVARCHAR(100)) = @ProductID`,
    `CAST([${row.BarcodeColumn}] AS NVARCHAR(100)) = @OldBarcode`,
  ];

  const result = await pool.request()
    .input("BatchID", sql.NVarChar(100), String(batchId || "").trim())
    .input("ProductID", sql.NVarChar(100), String(productId || "").trim())
    .input("OldBarcode", sql.NVarChar(100), String(oldBarcode || "").trim())
    .input("NewBarcode", sql.NVarChar(100), String(newBarcode || "").trim())
    .input("Quantity", sql.Int, Number(quantity || 0))
    .input("IsActive", sql.Bit, Number(isActive || 0) === 1 ? 1 : 0)
    .query(`
      UPDATE BATCH_DETAIL
      SET
        [${row.BarcodeColumn}] = @NewBarcode,
        [${row.QuantityColumn}] = @Quantity,
        [${row.ActiveColumn}] = @IsActive
      WHERE ${whereParts.join(" AND ")}

      SELECT @@ROWCOUNT AS UpdatedRows;
    `);

  return Number(result.recordset?.[0]?.UpdatedRows || 0);
};
