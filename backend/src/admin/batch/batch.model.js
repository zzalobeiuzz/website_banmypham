const sql = require("mssql");
const { connectDB } = require("../../config/connect");

const BATCH_TABLE = "BATCHES";

exports.syncExpiredBatchDetailsStatus = async () => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      IF OBJECT_ID('BARCODE', 'U') IS NULL
      BEGIN
        SELECT 0 AS UpdatedRows;
        RETURN;
      END

      UPDATE BC
      SET BC.IsActive = 0
      FROM BARCODE BC
      WHERE ISNULL(BC.IsActive, 1) = 1
        AND BC.ExpiryDate IS NOT NULL
        AND CAST(BC.ExpiryDate AS DATE) < CAST(GETDATE() AS DATE);

      SELECT @@ROWCOUNT AS UpdatedRows;
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
        BC.ProductID,
        P.ProductName,
        P.Image,
        BC.Barcode,
        BD.Quantity,
        BC.CreatedAt,
        BC.ExpiryDate,
        ISNULL(BC.IsActive, 1) AS IsActive
      FROM BATCH_DETAIL BD
      INNER JOIN BARCODE BC ON BC.id_batch_detail = BD.Id
      LEFT JOIN PRODUCT P ON P.ProductID = BC.ProductID
      WHERE CAST(BD.BatchId AS NVARCHAR(100)) = @BatchID
      ORDER BY BC.CreatedAt DESC, BC.ProductID ASC
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
          SET BatchId = @NewBatchID
          WHERE CAST(BatchId AS NVARCHAR(100)) = @OldBatchID
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
      WHERE CAST(BatchId AS NVARCHAR(100)) = @BatchID
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
      SELECT TOP 1 BD.BatchId AS BatchID, BC.ProductID, BC.Barcode
      FROM BARCODE BC
      INNER JOIN BATCH_DETAIL BD ON BD.Id = BC.id_batch_detail
      WHERE CAST(BC.Barcode AS NVARCHAR(100)) = @Barcode
    `);

  return result.recordset?.[0] || null;
};

exports.addProductToBatch = async ({
  batchId,
  productId,
  barcode,
  quantity,
  isActive,
  expiryDate,
}) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("BatchID", sql.NVarChar(100), String(batchId || "").trim())
    .input("ProductID", sql.NVarChar(100), String(productId || "").trim())
    .input("Barcode", sql.NVarChar(100), String(barcode || "").trim())
    .input("Quantity", sql.Int, Number(quantity || 0))
    .input("IsActive", sql.Bit, Number(isActive || 0) === 1 ? 1 : 0)
    .input("ExpiryDate", sql.Date, expiryDate ? new Date(String(expiryDate)) : null)
    .query(`
      DECLARE @Inserted TABLE (Id INT);

      INSERT INTO BATCH_DETAIL (BatchId, Barcode, Quantity)
      OUTPUT INSERTED.Id INTO @Inserted
      VALUES (@BatchID, @Barcode, @Quantity);

      INSERT INTO BARCODE (Barcode, ProductID, id_batch_detail, ExpiryDate, CreatedAt, IsActive)
      SELECT @Barcode, @ProductID, Id, @ExpiryDate, CAST(GETDATE() AS DATE), @IsActive
      FROM @Inserted;

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
  expiryDate,
}) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("BatchID", sql.NVarChar(100), String(batchId || "").trim())
    .input("ProductID", sql.NVarChar(100), String(productId || "").trim())
    .input("OldBarcode", sql.NVarChar(100), String(oldBarcode || "").trim())
    .input("NewBarcode", sql.NVarChar(100), String(newBarcode || "").trim())
    .input("Quantity", sql.Int, Number(quantity || 0))
    .input("IsActive", sql.Bit, Number(isActive || 0) === 1 ? 1 : 0)
    .input("ExpiryDate", sql.Date, expiryDate ? new Date(String(expiryDate)) : null)
    .query(`
      UPDATE BD
      SET BD.Barcode = @NewBarcode,
          BD.Quantity = @Quantity
      FROM BATCH_DETAIL BD
      INNER JOIN BARCODE BC ON BC.id_batch_detail = BD.Id
      WHERE CAST(BD.BatchId AS NVARCHAR(100)) = @BatchID
        AND CAST(BC.ProductID AS NVARCHAR(100)) = @ProductID
        AND CAST(BC.Barcode AS NVARCHAR(100)) = @OldBarcode;

      DECLARE @UpdatedRows INT = @@ROWCOUNT;

      UPDATE BC
      SET BC.Barcode = @NewBarcode,
          BC.ExpiryDate = @ExpiryDate,
          BC.IsActive = @IsActive
      FROM BARCODE BC
      INNER JOIN BATCH_DETAIL BD ON BD.Id = BC.id_batch_detail
      WHERE CAST(BD.BatchId AS NVARCHAR(100)) = @BatchID
        AND CAST(BC.ProductID AS NVARCHAR(100)) = @ProductID
        AND CAST(BC.Barcode AS NVARCHAR(100)) = @OldBarcode;

      SELECT @UpdatedRows AS UpdatedRows;
    `);

  return Number(result.recordset?.[0]?.UpdatedRows || 0);
};
