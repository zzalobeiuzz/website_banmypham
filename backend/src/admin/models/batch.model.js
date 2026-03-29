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
    SELECT ID, CreatedAt, Note
    FROM ${BATCH_TABLE}
    ORDER BY CreatedAt DESC
  `);

  return result.recordset;
};
