const { connectDB } = require("../../config/connect");
const sql = require("mssql");

const createAutoBatchForProduct = async (transaction, payload = {}) => {
  const productId = String(payload.productId || "").trim();
  const shouldDeactivateMissingLots = payload.deactivateMissingLots === true;
  if (!productId) {
    return;
  }

  const incomingBatches = Array.isArray(payload.batchDetails) ? payload.batchDetails : [];
  const normalizedBatches = incomingBatches
    .map((batch) => ({
      batchId: String(batch?.batchId || payload.batchId || "").trim(),
      barcode: String(batch?.barcode || "").trim(),
      quantity: Number(batch?.quantity || 0),
      createdAt: batch?.createdAt || null,
      expiryDate: batch?.expiryDate || null,
      note: batch?.note || "",
    }))
    .filter((batch) => !Number.isNaN(batch.quantity) && batch.quantity > 0);

  if (normalizedBatches.length === 0) {
    return;
  }

  const meta = await new sql.Request(transaction).query(`
    SELECT
      CASE WHEN OBJECT_ID('BATCHES', 'U') IS NOT NULL THEN 1 ELSE 0 END AS HasBatches,
      CASE
        WHEN COL_LENGTH('BATCHES', 'ID') IS NOT NULL THEN 'ID'
        WHEN COL_LENGTH('BATCHES', 'Id') IS NOT NULL THEN 'Id'
        WHEN COL_LENGTH('BATCHES', 'BatchID') IS NOT NULL THEN 'BatchID'
        WHEN COL_LENGTH('BATCHES', 'BatchId') IS NOT NULL THEN 'BatchId'
        ELSE NULL
      END AS BatchKeyColumn,
      CASE
        WHEN COL_LENGTH('BATCHES', 'CreatedAt') IS NOT NULL THEN 'CreatedAt'
        WHEN COL_LENGTH('BATCHES', 'CreateAt') IS NOT NULL THEN 'CreateAt'
        ELSE NULL
      END AS BatchCreatedColumn,
      CASE
        WHEN COL_LENGTH('BATCHES', 'Note') IS NOT NULL THEN 'Note'
        ELSE NULL
      END AS BatchNoteColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'ProductID') IS NOT NULL THEN 'ProductID'
        WHEN COL_LENGTH('BATCH_DETAIL', 'ProductId') IS NOT NULL THEN 'ProductId'
        ELSE NULL
      END AS BdProductColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'Quantity') IS NOT NULL THEN 'Quantity'
        WHEN COL_LENGTH('BATCH_DETAIL', 'StockQuantity') IS NOT NULL THEN 'StockQuantity'
        ELSE NULL
      END AS BdQuantityColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'Barcode') IS NOT NULL THEN 'Barcode'
        WHEN COL_LENGTH('BATCH_DETAIL', 'BatchBarcode') IS NOT NULL THEN 'BatchBarcode'
        WHEN COL_LENGTH('BATCH_DETAIL', 'BarCode') IS NOT NULL THEN 'BarCode'
        WHEN COL_LENGTH('BATCH_DETAIL', 'Code') IS NOT NULL THEN 'Code'
        ELSE NULL
      END AS BdBarcodeColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'BatchID') IS NOT NULL THEN 'BatchID'
        WHEN COL_LENGTH('BATCH_DETAIL', 'BatchId') IS NOT NULL THEN 'BatchId'
        WHEN COL_LENGTH('BATCH_DETAIL', 'IDBatch') IS NOT NULL THEN 'IDBatch'
        WHEN COL_LENGTH('BATCH_DETAIL', 'ID') IS NOT NULL THEN 'ID'
        WHEN COL_LENGTH('BATCH_DETAIL', 'Id') IS NOT NULL THEN 'Id'
        ELSE NULL
      END AS BdBatchFKColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'CreatedAt') IS NOT NULL THEN 'CreatedAt'
        WHEN COL_LENGTH('BATCH_DETAIL', 'ImportDate') IS NOT NULL THEN 'ImportDate'
        ELSE NULL
      END AS BdCreatedColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'IsActive') IS NOT NULL THEN 'IsActive'
        WHEN COL_LENGTH('BATCH_DETAIL', 'isActive') IS NOT NULL THEN 'isActive'
        ELSE NULL
      END AS BdIsActiveColumn,
      CASE
        WHEN COL_LENGTH('BATCH_DETAIL', 'ExpiryDate') IS NOT NULL THEN 'ExpiryDate'
        WHEN COL_LENGTH('BATCH_DETAIL', 'ExpiredDate') IS NOT NULL THEN 'ExpiredDate'
        WHEN COL_LENGTH('BATCH_DETAIL', 'ExpireDate') IS NOT NULL THEN 'ExpireDate'
        ELSE NULL
      END AS BdExpiryColumn
  `);

  const row = meta.recordset?.[0] || {};
  const bdProductColumn = row.BdProductColumn;
  const bdQuantityColumn = row.BdQuantityColumn;
  const bdBarcodeColumn = row.BdBarcodeColumn;
  const bdBatchFKColumn = row.BdBatchFKColumn;
  const bdCreatedColumn = row.BdCreatedColumn;
  const bdIsActiveColumn = row.BdIsActiveColumn;
  const bdExpiryColumn = row.BdExpiryColumn;

  if (!bdProductColumn || !bdQuantityColumn) {
    return;
  }

  let isBatchIdentity = false;
  if (row.HasBatches === 1 && row.BatchKeyColumn && bdBatchFKColumn) {
    try {
      const identityInfo = await new sql.Request(transaction)
        .input("BatchKeyColumn", sql.NVarChar(128), row.BatchKeyColumn)
        .query(`
          SELECT CASE
            WHEN COLUMNPROPERTY(OBJECT_ID('BATCHES'), @BatchKeyColumn, 'IsIdentity') = 1 THEN 1
            ELSE 0
          END AS IsIdentity
        `);
      isBatchIdentity = Number(identityInfo.recordset?.[0]?.IsIdentity || 0) === 1;
    } catch (identityErr) {
      console.warn("⚠️ Không đọc được metadata identity của BATCHES:", identityErr.message);
      isBatchIdentity = false;
    }
  }

  for (let i = 0; i < normalizedBatches.length; i += 1) {
    const batch = normalizedBatches[i];
    let batchIdValue = String(batch?.batchId || "").trim() || null;

    if (batchIdValue && row.HasBatches === 1 && row.BatchKeyColumn && bdBatchFKColumn) {
      const existingBatch = await new sql.Request(transaction)
        .input("BatchID", sql.NVarChar(100), batchIdValue)
        .query(`
          SELECT TOP 1 [${row.BatchKeyColumn}] AS BatchID
          FROM BATCHES
          WHERE CAST([${row.BatchKeyColumn}] AS NVARCHAR(100)) = @BatchID
        `);

      const existedBatchId = existingBatch.recordset?.[0]?.BatchID;
      if (existedBatchId) {
        batchIdValue = String(existedBatchId).trim();
      } else {
        const noteText = batch.note || payload.note || `Lô từ nhập mã khi thêm sản phẩm ${productId}`;

        if (isBatchIdentity) {
          const insertCols = [];
          const insertVals = [];

          if (row.BatchCreatedColumn) {
            insertCols.push(`[${row.BatchCreatedColumn}]`);
            insertVals.push("GETDATE()");
          }
          if (row.BatchNoteColumn) {
            insertCols.push(`[${row.BatchNoteColumn}]`);
            insertVals.push("@BatchNote");
          }

          const insertSql = insertCols.length
            ? `
              INSERT INTO BATCHES (${insertCols.join(", ")})
              VALUES (${insertVals.join(", ")});
            `
            : "INSERT INTO BATCHES DEFAULT VALUES;";

          const inserted = await new sql.Request(transaction)
            .input("BatchNote", sql.NVarChar(255), `${noteText} (${batchIdValue})`)
            .query(`
              ${insertSql}
              SELECT CAST(SCOPE_IDENTITY() AS NVARCHAR(100)) AS BatchId;
            `);

          batchIdValue = inserted.recordset?.[0]?.BatchId || null;
        } else {
          const insertCols = [`[${row.BatchKeyColumn}]`];
          const insertVals = ["@BatchID"];

          if (row.BatchCreatedColumn) {
            insertCols.push(`[${row.BatchCreatedColumn}]`);
            insertVals.push("GETDATE()");
          }
          if (row.BatchNoteColumn) {
            insertCols.push(`[${row.BatchNoteColumn}]`);
            insertVals.push("@BatchNote");
          }

          await new sql.Request(transaction)
            .input("BatchID", sql.NVarChar(100), batchIdValue)
            .input("BatchNote", sql.NVarChar(255), noteText)
            .query(`
              INSERT INTO BATCHES (${insertCols.join(", ")})
              VALUES (${insertVals.join(", ")})
            `);
        }
      }
    }

    if (!batchIdValue && row.HasBatches === 1 && row.BatchKeyColumn && bdBatchFKColumn) {
      try {
        const noteText = batch.note || payload.note || `Lô tự động từ thêm sản phẩm ${productId}`;

        if (isBatchIdentity) {
          const insertCols = [];
          const insertVals = [];

          if (row.BatchCreatedColumn) {
            insertCols.push(`[${row.BatchCreatedColumn}]`);
            insertVals.push("GETDATE()");
          }
          if (row.BatchNoteColumn) {
            insertCols.push(`[${row.BatchNoteColumn}]`);
            insertVals.push("@BatchNote");
          }

          const insertSql = insertCols.length
            ? `
              INSERT INTO BATCHES (${insertCols.join(", ")})
              VALUES (${insertVals.join(", ")});
            `
            : "INSERT INTO BATCHES DEFAULT VALUES;";

          const inserted = await new sql.Request(transaction)
            .input("BatchNote", sql.NVarChar(255), `${noteText} #${i + 1}`)
            .query(`
              ${insertSql}
              SELECT CAST(SCOPE_IDENTITY() AS NVARCHAR(100)) AS BatchId;
            `);

          batchIdValue = inserted.recordset?.[0]?.BatchId || null;
        } else {
          batchIdValue = `BATCH_${Date.now()}_${i}_${Math.floor(Math.random() * 10000)}`;
          const insertCols = [`[${row.BatchKeyColumn}]`];
          const insertVals = ["@BatchID"];

          if (row.BatchCreatedColumn) {
            insertCols.push(`[${row.BatchCreatedColumn}]`);
            insertVals.push("GETDATE()");
          }
          if (row.BatchNoteColumn) {
            insertCols.push(`[${row.BatchNoteColumn}]`);
            insertVals.push("@BatchNote");
          }

          await new sql.Request(transaction)
            .input("BatchID", sql.NVarChar(100), batchIdValue)
            .input("BatchNote", sql.NVarChar(255), `${noteText} #${i + 1}`)
            .query(`
              INSERT INTO BATCHES (${insertCols.join(", ")})
              VALUES (${insertVals.join(", ")})
            `);
        }
      } catch (batchInsertError) {
        console.warn("⚠️ Không tạo được BATCHES, sẽ tiếp tục lưu BATCH_DETAIL:", batchInsertError.message);
        batchIdValue = null;
      }
    }

    const detailCols = [`[${bdProductColumn}]`, `[${bdQuantityColumn}]`];
    const detailVals = ["@ProductID", "@Quantity"];

    if (bdBarcodeColumn) {
      detailCols.push(`[${bdBarcodeColumn}]`);
      detailVals.push("@Barcode");
    }
    if (bdBatchFKColumn && batchIdValue) {
      detailCols.push(`[${bdBatchFKColumn}]`);
      detailVals.push("@BatchID");
    }
    if (bdCreatedColumn) {
      detailCols.push(`[${bdCreatedColumn}]`);
      detailVals.push("@CreatedAt");
    }
    if (bdIsActiveColumn) {
      detailCols.push(`[${bdIsActiveColumn}]`);
      detailVals.push("1");
    }
    if (bdExpiryColumn) {
      detailCols.push(`[${bdExpiryColumn}]`);
      detailVals.push("@ExpiryDate");
    }

    let hasExistingDetail = false;
    if (bdBatchFKColumn && batchIdValue) {
      const existedProductInBatch = await new sql.Request(transaction)
        .input("ProductID", sql.VarChar(50), productId)
        .input("BatchID", sql.NVarChar(100), batchIdValue)
        .query(`
          SELECT TOP 1 1 AS ExistsRow
          FROM BATCH_DETAIL
          WHERE [${bdProductColumn}] = @ProductID
            AND CAST([${bdBatchFKColumn}] AS NVARCHAR(100)) = @BatchID
            ${bdIsActiveColumn ? `AND ISNULL([${bdIsActiveColumn}], 1) = 1` : ""}
        `);

      hasExistingDetail = !!existedProductInBatch.recordset?.[0]?.ExistsRow;
    } else if (bdBarcodeColumn && batch.barcode) {
      const existedProductByBarcode = await new sql.Request(transaction)
        .input("ProductID", sql.VarChar(50), productId)
        .input("Barcode", sql.VarChar(100), batch.barcode)
        .query(`
          SELECT TOP 1 1 AS ExistsRow
          FROM BATCH_DETAIL
          WHERE [${bdProductColumn}] = @ProductID
            AND [${bdBarcodeColumn}] = @Barcode
            ${bdIsActiveColumn ? `AND ISNULL([${bdIsActiveColumn}], 1) = 1` : ""}
        `);

      hasExistingDetail = !!existedProductByBarcode.recordset?.[0]?.ExistsRow;
    }

    if (hasExistingDetail) {
      const setParts = [`[${bdQuantityColumn}] = @Quantity`];
      if (bdBarcodeColumn) {
        setParts.push(`[${bdBarcodeColumn}] = @Barcode`);
      }
      if (bdBatchFKColumn && batchIdValue) {
        setParts.push(`[${bdBatchFKColumn}] = @BatchID`);
      }
      if (bdCreatedColumn) {
        setParts.push(`[${bdCreatedColumn}] = @CreatedAt`);
      }
      if (bdExpiryColumn) {
        setParts.push(`[${bdExpiryColumn}] = @ExpiryDate`);
      }
      if (bdIsActiveColumn) {
        setParts.push(`[${bdIsActiveColumn}] = 1`);
      }

      const whereParts = [`[${bdProductColumn}] = @ProductID`];
      if (bdBatchFKColumn && batchIdValue) {
        whereParts.push(`CAST([${bdBatchFKColumn}] AS NVARCHAR(100)) = @BatchID`);
      } else if (bdBarcodeColumn && batch.barcode) {
        whereParts.push(`[${bdBarcodeColumn}] = @Barcode`);
      }
      if (bdIsActiveColumn) {
        whereParts.push(`ISNULL([${bdIsActiveColumn}], 1) = 1`);
      }

      await new sql.Request(transaction)
        .input("ProductID", sql.VarChar(50), productId)
        .input("Quantity", sql.Int, batch.quantity)
        .input("Barcode", sql.VarChar(100), batch.barcode || null)
        .input("BatchID", sql.NVarChar(100), batchIdValue)
        .input("CreatedAt", sql.DateTime, batch.createdAt ? new Date(batch.createdAt) : new Date())
        .input("ExpiryDate", sql.Date, batch.expiryDate ? new Date(batch.expiryDate) : null)
        .query(`
          UPDATE BATCH_DETAIL
          SET ${setParts.join(", ")}
          WHERE ${whereParts.join(" AND ")}
        `);
      continue;
    }

    if (bdBatchFKColumn && !batchIdValue) {
      throw new Error("Thiếu mã lô hàng để lưu BATCH_DETAIL");
    }

    await new sql.Request(transaction)
      .input("ProductID", sql.VarChar(50), productId)
      .input("Quantity", sql.Int, batch.quantity)
      .input("Barcode", sql.VarChar(100), batch.barcode || null)
      .input("BatchID", sql.NVarChar(100), batchIdValue)
      .input("CreatedAt", sql.DateTime, batch.createdAt ? new Date(batch.createdAt) : new Date())
      .input("ExpiryDate", sql.Date, batch.expiryDate ? new Date(batch.expiryDate) : null)
      .query(`
        INSERT INTO BATCH_DETAIL (${detailCols.join(", ")})
        VALUES (${detailVals.join(", ")})
      `);
  }

  if (shouldDeactivateMissingLots && bdIsActiveColumn && bdBatchFKColumn) {
    const incomingBatchIds = Array.from(
      new Set(
        normalizedBatches
          .map((batch) => String(batch?.batchId || "").trim())
          .filter(Boolean),
      ),
    );

    const deactivateRequest = new sql.Request(transaction)
      .input("ProductID", sql.VarChar(50), productId);

    let excludeClause = "";
    if (incomingBatchIds.length > 0) {
      const placeholders = incomingBatchIds.map((_, index) => `@KeepBatchID_${index}`);
      incomingBatchIds.forEach((batchId, index) => {
        deactivateRequest.input(`KeepBatchID_${index}`, sql.NVarChar(100), batchId);
      });
      excludeClause = `AND CAST([${bdBatchFKColumn}] AS NVARCHAR(100)) NOT IN (${placeholders.join(", ")})`;
    }

    await deactivateRequest.query(`
      UPDATE BATCH_DETAIL
      SET [${bdIsActiveColumn}] = 0
      WHERE [${bdProductColumn}] = @ProductID
        AND ISNULL([${bdIsActiveColumn}], 1) = 1
        ${excludeClause}
    `);
  }
};

// =========================ĐỒNG BỘ TRẠNG THÁI LÔ HẾT HẠN====================
/**
 * Tự động chuyển IsActive = 0 cho các dòng BATCH_DETAIL đã quá hạn.
 * Chạy an toàn với nhiều tên cột hạn sử dụng khác nhau.
 * @returns {Promise<number>} Số dòng được cập nhật
 */
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
    console.error("❌ Lỗi khi đồng bộ trạng thái lô hết hạn:", error.message);
    return 0;
  }
};

// =========================KIỂM TRA SẢN PHẨM====================
/**
 * Hàm kiểm tra xem sản phẩm có tồn tại hay không
 * @param {string} productId - Mã sản phẩm
 * @returns {Promise<boolean>} - true nếu tồn tại, false nếu không tồn tại
 */
exports.checkProductExists = async (productId) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("ProductID", sql.VarChar(50), productId)
      .query(`
            SELECT 
            P.*,                          -- 🟢 Lấy toàn bộ cột của bảng PRODUCT (sản phẩm)
        ISNULL(BDQ.StockQuantity, 0) AS BatchStockQuantity,
          
            -- 🟣 Thông tin tên danh mục (Category)
            C.CategoryName,              -- 🔸 Tên danh mục chính

            -- 🟣 Thông tin danh mục phụ (SubCategory)
            SC.SubCategoryName,           -- 🔸 Tên danh mục phụ
          
            -- 🟡 Thông tin chi tiết sản phẩm (Detail)
            D.Usage,                      -- 🔹 Công dụng
            D.Ingredient,                -- 🔹 Thành phần
            D.ProductDescription,         -- 🔹 Hướng dẫn sử dụng
            D.HowToUse                    -- 🔹 Thông tin khác (nếu có)
          
          FROM PRODUCT P

          -- 🔗 Lấy tên Catagory
          LEFT JOIN Category C ON P.CategoryID = C.CategoryID

          -- 🔗 Lấy tên SubCategory
          LEFT JOIN Sub_Category SC ON P.SubCategoryID = SC.SubCategoryID

          LEFT JOIN (
            SELECT ProductID, SUM(CAST(Quantity AS INT)) AS StockQuantity
            FROM BATCH_DETAIL
            WHERE ISNULL(IsActive, 1) = 1
            GROUP BY ProductID
          ) BDQ ON BDQ.ProductID = P.ProductID
          
          -- 🔗 Lấy chi tiết sản phẩm
          LEFT JOIN Product_Detail D ON P.DetailID = D.IDDetail
          
          -- 🔍 Điều kiện lọc: sản phẩm có ProductID cụ thể
          WHERE P.ProductID = @ProductID
      `);

    if (result.recordset.length === 0) return null;
    // console.log(result)
    // ✅ Trích xuất và cấu trúc lại dữ liệu
    const {
      CategoryName,
      SubCategoryName,
      BatchStockQuantity,
      IDDetail,
      Usage,
      Ingredient,
      ProductDescription,
      HowToUse,
      ...productInfo
    } = result.recordset[0];

    return {
      ...productInfo,
      CategoryName:CategoryName,
      SubCategoryName:SubCategoryName,
      StockQuantity: Number(BatchStockQuantity || 0),
      Usage:Usage,
      Ingredient:Ingredient,
      ProductDescription:ProductDescription,
      HowToUse:HowToUse,
    };

  } catch (error) {
    console.error("❌ Lỗi khi truy vấn sản phẩm:", error.message);
    throw new Error("Đã xảy ra lỗi khi kiểm tra sản phẩm");
  }
};

// =========================KIỂM TRA SẢN PHẨM THEO BARCODE====================
/**
 * Hàm kiểm tra sản phẩm theo barcode
 * @param {string} barcode - Mã vạch sản phẩm
 * @returns {Promise<object|null>} - Thông tin sản phẩm nếu tồn tại
 */
exports.checkProductExistsByBarcode = async (barcode) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("Barcode", sql.VarChar(100), barcode)
      .query(`
            DECLARE @batchBarcodeColumn SYSNAME = NULL;

            IF COL_LENGTH('BATCH_DETAIL', 'Barcode') IS NOT NULL SET @batchBarcodeColumn = 'Barcode';
            ELSE IF COL_LENGTH('BATCH_DETAIL', 'BatchBarcode') IS NOT NULL SET @batchBarcodeColumn = 'BatchBarcode';
            ELSE IF COL_LENGTH('BATCH_DETAIL', 'BarCode') IS NOT NULL SET @batchBarcodeColumn = 'BarCode';
            ELSE IF COL_LENGTH('BATCH_DETAIL', 'Code') IS NOT NULL SET @batchBarcodeColumn = 'Code';

            IF @batchBarcodeColumn IS NOT NULL
            BEGIN
              DECLARE @sql NVARCHAR(MAX) = N'
                SELECT TOP 1
                  P.*,                          -- Lấy toàn bộ cột của bảng PRODUCT
                  ISNULL(BDQ.StockQuantity, 0) AS BatchStockQuantity,
                  C.CategoryName,               -- Tên danh mục chính
                  SC.SubCategoryName,           -- Tên danh mục phụ
                  D.Usage,                      -- Công dụng
                  D.Ingredient,                 -- Thành phần
                  D.ProductDescription,         -- Mô tả sản phẩm
                  D.HowToUse,                   -- Hướng dẫn sử dụng
                  BD.' + QUOTENAME(@batchBarcodeColumn) + N' AS MatchedBatchBarcode
                FROM BATCH_DETAIL BD
                INNER JOIN PRODUCT P ON P.ProductID = BD.ProductID
                LEFT JOIN Category C ON P.CategoryID = C.CategoryID
                LEFT JOIN Sub_Category SC ON P.SubCategoryID = SC.SubCategoryID
                LEFT JOIN (
                  SELECT ProductID, SUM(CAST(Quantity AS INT)) AS StockQuantity
                  FROM BATCH_DETAIL
                  WHERE ISNULL(IsActive, 1) = 1
                  GROUP BY ProductID
                ) BDQ ON BDQ.ProductID = P.ProductID
                LEFT JOIN Product_Detail D ON P.DetailID = D.IDDetail
                WHERE BD.' + QUOTENAME(@batchBarcodeColumn) + N' = @Barcode
              ';

              EXEC sp_executesql @sql, N'@Barcode VARCHAR(100)', @Barcode = @Barcode;
              RETURN;
            END

            SELECT TOP 0
              P.*,                          -- Không có cột barcode để fallback
              CAST(0 AS INT) AS BatchStockQuantity,
              CAST(NULL AS NVARCHAR(255)) AS CategoryName,
              CAST(NULL AS NVARCHAR(255)) AS SubCategoryName,
              CAST(NULL AS NVARCHAR(MAX)) AS Usage,
              CAST(NULL AS NVARCHAR(MAX)) AS Ingredient,
              CAST(NULL AS NVARCHAR(MAX)) AS ProductDescription,
              CAST(NULL AS NVARCHAR(MAX)) AS HowToUse,
              CAST(NULL AS NVARCHAR(255)) AS MatchedBatchBarcode
            FROM PRODUCT P
      `);

    const firstRow = result.recordset?.[0] || null;

    if (!firstRow) return null;

    const {
      CategoryName,
      SubCategoryName,
      BatchStockQuantity,
      Usage,
      Ingredient,
      ProductDescription,
      HowToUse,
      MatchedBatchBarcode,
      ...productInfo
    } = firstRow;

    return {
      ...productInfo,
      CategoryName,
      SubCategoryName,
      StockQuantity: Number(BatchStockQuantity || 0),
      Usage,
      Ingredient,
      ProductDescription,
      HowToUse,
      MatchedBatchBarcode,
    };
  } catch (error) {
    console.error("❌ Lỗi khi truy vấn sản phẩm theo barcode:", error.message);
    throw new Error("Đã xảy ra lỗi khi kiểm tra sản phẩm theo barcode");
  }
};

// =========================KIỂM TRA BARCODE CÓ TRÙNG TRONG CÙNG SẢN PHẨM KHÔNG====================
/**
 * Kiểm tra xem barcode đã tồn tại cho product này chưa (kiểm tra duplicate barcode trong cùng sản phẩm)
 * @param {string} productId - Mã sản phẩm
 * @param {string} barcode - Mã vạch
 * @returns {Promise<boolean>} - true nếu barcode đã tồn tại cho product này
 */
exports.checkBarcodeExistsForProduct = async (productId, barcode, excludeBatchId = "") => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("ProductID", sql.VarChar(50), productId)
      .input("Barcode", sql.VarChar(100), barcode)
      .input("ExcludeBatchID", sql.NVarChar(100), String(excludeBatchId || "").trim())
      .query(`
        DECLARE @batchBarcodeColumn SYSNAME = NULL;
        DECLARE @batchFKColumn SYSNAME = NULL;
        DECLARE @isActiveColumn SYSNAME = NULL;

        IF COL_LENGTH('BATCH_DETAIL', 'Barcode') IS NOT NULL SET @batchBarcodeColumn = 'Barcode';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'BatchBarcode') IS NOT NULL SET @batchBarcodeColumn = 'BatchBarcode';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'BarCode') IS NOT NULL SET @batchBarcodeColumn = 'BarCode';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'Code') IS NOT NULL SET @batchBarcodeColumn = 'Code';

        IF COL_LENGTH('BATCH_DETAIL', 'BatchID') IS NOT NULL SET @batchFKColumn = 'BatchID';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'BatchId') IS NOT NULL SET @batchFKColumn = 'BatchId';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'IDBatch') IS NOT NULL SET @batchFKColumn = 'IDBatch';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'ID') IS NOT NULL SET @batchFKColumn = 'ID';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'Id') IS NOT NULL SET @batchFKColumn = 'Id';

        IF COL_LENGTH('BATCH_DETAIL', 'IsActive') IS NOT NULL SET @isActiveColumn = 'IsActive';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'isActive') IS NOT NULL SET @isActiveColumn = 'isActive';

        IF @batchBarcodeColumn IS NOT NULL
        BEGIN
          DECLARE @sql NVARCHAR(MAX) = N'
            SELECT COUNT(*) AS BarcodeCount
            FROM BATCH_DETAIL
            WHERE ProductID = @ProductID
              AND ' + QUOTENAME(@batchBarcodeColumn) + N' = @Barcode';

          IF @isActiveColumn IS NOT NULL
            SET @sql += N' AND ISNULL(' + QUOTENAME(@isActiveColumn) + N', 1) = 1';

          IF @batchFKColumn IS NOT NULL
            SET @sql += N' AND (@ExcludeBatchID = '''' OR CAST(' + QUOTENAME(@batchFKColumn) + N' AS NVARCHAR(100)) <> @ExcludeBatchID)';

          EXEC sp_executesql @sql, N'@ProductID VARCHAR(50), @Barcode VARCHAR(100), @ExcludeBatchID NVARCHAR(100)', 
            @ProductID = @ProductID, @Barcode = @Barcode, @ExcludeBatchID = @ExcludeBatchID;
        END
        ELSE
        BEGIN
          SELECT 0 AS BarcodeCount;
        END
      `);

    const count = result.recordset?.[0]?.BarcodeCount || 0;
    return count > 0;
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra barcode cho sản phẩm:", error.message);
    throw new Error("Đã xảy ra lỗi khi kiểm tra barcode cho sản phẩm");
  }
};

// =========================HIỆN LẠI SẢN PHẨM THEO BARCODE====================
/**
 * Bỏ ẩn sản phẩm theo barcode (IsHidden: true -> false)
 * @param {string} barcode - Mã vạch sản phẩm
 * @returns {Promise<boolean>} - true nếu có sản phẩm được cập nhật
 */
exports.unhideProductByBarcode = async (barcode) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("Barcode", sql.VarChar(100), barcode)
      .query(`
        DECLARE @batchBarcodeColumn SYSNAME = NULL;

        IF COL_LENGTH('BATCH_DETAIL', 'Barcode') IS NOT NULL SET @batchBarcodeColumn = 'Barcode';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'BatchBarcode') IS NOT NULL SET @batchBarcodeColumn = 'BatchBarcode';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'BarCode') IS NOT NULL SET @batchBarcodeColumn = 'BarCode';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'Code') IS NOT NULL SET @batchBarcodeColumn = 'Code';

        IF @batchBarcodeColumn IS NULL
        BEGIN
          SELECT 0 AS AffectedRows;
          RETURN;
        END

        DECLARE @sql NVARCHAR(MAX) = N'
          UPDATE P
          SET P.IsHidden = 0,
              P.UpdatedAt = GETDATE()
          FROM PRODUCT P
          INNER JOIN BATCH_DETAIL BD ON BD.ProductID = P.ProductID
          WHERE P.IsHidden = 1
            AND BD.' + QUOTENAME(@batchBarcodeColumn) + N' = @Barcode
            AND ISNULL(BD.IsActive, 1) = 1;

          SELECT @@ROWCOUNT AS AffectedRows;
        ';

        EXEC sp_executesql @sql, N'@Barcode VARCHAR(100)', @Barcode = @Barcode;
      `);

    return Number(result.recordset?.[0]?.AffectedRows || 0) > 0;
  } catch (error) {
    console.error("❌ Lỗi khi hiện lại sản phẩm theo barcode:", error.message);
    throw new Error("Đã xảy ra lỗi khi cập nhật trạng thái hiển thị sản phẩm");
  }
};

// =========================HIỆN LẠI SẢN PHẨM THEO PRODUCT ID====================
/**
 * Bỏ ẩn sản phẩm theo ProductID (IsHidden: true -> false)
 * @param {string} productId - Mã sản phẩm
 * @returns {Promise<boolean>} - true nếu có sản phẩm được cập nhật
 */
exports.unhideProductByProductID = async (productId) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("ProductID", sql.VarChar(50), productId)
      .query(`
        UPDATE PRODUCT
        SET IsHidden = 0,
            UpdatedAt = GETDATE()
        WHERE ProductID = @ProductID
          AND IsHidden = 1
      `);

    return (result.rowsAffected?.[0] || 0) > 0;
  } catch (error) {
    console.error("❌ Lỗi khi hiện lại sản phẩm theo ProductID:", error.message);
    throw new Error("Đã xảy ra lỗi khi cập nhật trạng thái hiển thị sản phẩm");
  }
};

// =========================KIỂM TRA TRÙNG KHI THÊM MỚI (IsHidden = 0 / false)====================
/**
 * Kiểm tra trùng ProductID/Barcode trong nhóm sản phẩm có IsHidden = 0 (false)
 * @param {string} productId - Mã sản phẩm
 * @param {string} barcode - Mã vạch sản phẩm
 * @returns {Promise<{isDuplicateProductID:boolean, isDuplicateBarcode:boolean}>}
 */
exports.checkHiddenProductConflictForAdd = async (productId, barcode) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("ProductID", sql.VarChar(50), productId)
      .input("Barcode", sql.VarChar(100), barcode)
      .query(`
        DECLARE @batchBarcodeColumn SYSNAME = NULL;
        DECLARE @isDuplicateBatchBarcode INT = 0;
        DECLARE @isDuplicateProductID INT = 0;

        IF COL_LENGTH('BATCH_DETAIL', 'Barcode') IS NOT NULL SET @batchBarcodeColumn = 'Barcode';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'BatchBarcode') IS NOT NULL SET @batchBarcodeColumn = 'BatchBarcode';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'BarCode') IS NOT NULL SET @batchBarcodeColumn = 'BarCode';
        ELSE IF COL_LENGTH('BATCH_DETAIL', 'Code') IS NOT NULL SET @batchBarcodeColumn = 'Code';

        IF @batchBarcodeColumn IS NOT NULL AND LTRIM(RTRIM(ISNULL(@Barcode, ''))) <> ''
        BEGIN
          DECLARE @sql NVARCHAR(MAX) = N'
            SELECT @dupOut = CASE
              WHEN EXISTS (
                SELECT 1
                FROM BATCH_DETAIL BD
                INNER JOIN PRODUCT P ON P.ProductID = BD.ProductID
                WHERE P.IsHidden = 0
                  AND ISNULL(BD.IsActive, 1) = 1
                  AND BD.' + QUOTENAME(@batchBarcodeColumn) + N' = @Barcode
              ) THEN 1
              ELSE 0
            END
          ';

          EXEC sp_executesql
            @sql,
            N'@Barcode VARCHAR(100), @dupOut INT OUTPUT',
            @Barcode = @Barcode,
            @dupOut = @isDuplicateBatchBarcode OUTPUT;
        END

        SELECT
          @isDuplicateProductID = CASE
            WHEN EXISTS (
              SELECT 1
              FROM PRODUCT
              WHERE IsHidden = 0
                AND ProductID = @ProductID
            ) THEN 1
            ELSE 0
          END;

        SELECT
          @isDuplicateProductID AS IsDuplicateProductID,
          @isDuplicateBatchBarcode AS IsDuplicateBarcode
      `);

    const row = result.recordset?.[0] || {};
    return {
      isDuplicateProductID: row.IsDuplicateProductID === 1,
      isDuplicateBarcode: row.IsDuplicateBarcode === 1,
    };
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra trùng ProductID/Barcode (IsHidden=0):", error.message);
    throw new Error("Đã xảy ra lỗi khi kiểm tra trùng sản phẩm trước khi thêm mới");
  }
};

// =========================UPDATE THÔNG TIN SẢN PHẨM====================
/**
 * Hàm cập nhật thông tin sản phẩm
 * Chỉ cập nhật các trường được truyền vào (không bắt buộc phải truyền hết)
 * @param {object} product - Object chứa các trường thông tin sản phẩm
 * @returns {Promise<object>} - Kết quả cập nhật với success & message
 */
exports.updateProduct = async (product) => {
  const pool = await connectDB();

  // Destructure các trường trong object product
  const {
    ProductID,
    ProductName,
    Description,
    IsHot,
    Type,
    Price,
    CategoryID,
    SubCategoryID,
    UpdatedAt,
    SupplierID,
    Image,
    
  } = product;

  // Tạo mảng chứa các trường cần update (chỉ thêm nếu trường đó có giá trị)
  const updateFields = [];

  if (ProductName !== undefined) updateFields.push(`ProductName = @ProductName`);
  if (Description !== undefined) updateFields.push(`Description = @Description`);
  if (IsHot !== undefined) updateFields.push(`IsHot = @IsHot`);
  if (Type !== undefined) updateFields.push(`Type = @Type`);
  if (Price !== undefined) updateFields.push(`Price = @Price`);
  if (CategoryID !== undefined) updateFields.push(`CategoryID = @CategoryID`);
  if (SubCategoryID !== undefined) updateFields.push(`SubCategoryID = @SubCategoryID`);
  if (UpdatedAt !== undefined) updateFields.push(`UpdatedAt = @UpdatedAt`);
  if (SupplierID !== undefined) updateFields.push(`SupplierID = @SupplierID`);
  if (Image !== undefined) updateFields.push(`Image = @Image`);

  // Nếu không có trường nào để cập nhật
  if (updateFields.length === 0) {
    return { success: false, message: "Không có trường nào để cập nhật" };
  }

  // Tạo request với các input tương ứng
  await pool.request()
    .input("ProductID", sql.VarChar(50), ProductID)
    .input("ProductName", sql.NVarChar(sql.MAX), ProductName ?? null)
    .input("Description", sql.NVarChar(sql.MAX), Description ?? null)
    .input("IsHot", sql.TinyInt, IsHot ?? null)
    .input("Type", sql.NVarChar(sql.MAX), Type ?? null)
    .input("Price", sql.Int, Price ?? null)
    .input("CategoryID", sql.NVarChar(100), CategoryID ?? null)
    .input("SubCategoryID", sql.NVarChar(100), SubCategoryID ?? null)
    .input("UpdatedAt", sql.Date, UpdatedAt ?? new Date()) // Mặc định lấy ngày hiện tại nếu không truyền vào
    .input("SupplierID", sql.NVarChar(100), SupplierID ?? null)
    .input("Image", sql.NVarChar(sql.MAX), Image ?? null)
    .query(`
      UPDATE PRODUCT
      SET ${updateFields.join(", ")}
      WHERE ProductID = @ProductID
    `);

  return { success: true, message: `Cập nhật sản phẩm ID ${ProductID} thành công` };
};

// =========================CẬP NHẬT ĐẦY ĐỦ SẢN PHẨM TỪ MÀN THÊM MỚI====================
/**
 * Cập nhật đầy đủ thông tin PRODUCT và PRODUCT_DETAIL theo ProductID
 * @param {object} product - Thông tin sản phẩm từ form thêm/sửa
 * @returns {Promise<object>} - Kết quả cập nhật
 */
exports.updateProductFromAddFormDB = async (product) => {
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const {
      ProductID,
      ProductName,
      Price,
      Type,
      CategoryID,
      SubCategoryID,
      SupplierID,
      IsHot,
      Image,
      DetailID,
      ProductDescription,
      Ingredients,
      Usage,
      Instructions,
      UpdatedAt,
      BatchDetails,
      BatchID,
    } = product;

    const normalizedImage =
      Image && Image !== "null" && Image !== "undefined" ? Image : null;

    const productRequest = new sql.Request(transaction);
    await productRequest
      .input("ProductID", sql.VarChar(50), ProductID)
      .input("ProductName", sql.NVarChar(sql.MAX), ProductName ?? null)
      .input("Price", sql.Int, Price ?? 0)
      .input("Type", sql.NVarChar(100), Type ?? null)
      .input("CategoryID", sql.NVarChar(100), CategoryID ?? null)
      .input("SubCategoryID", sql.NVarChar(50), SubCategoryID ?? null)
      .input("SupplierID", sql.NVarChar(100), SupplierID ?? null)
      .input("IsHot", sql.TinyInt, IsHot ?? 0)
      .input("Image", sql.NVarChar(sql.MAX), normalizedImage)
      .input("UpdatedAt", sql.DateTime, UpdatedAt ?? new Date())
      .query(`
        UPDATE PRODUCT
        SET
          ProductName = @ProductName,
          Price = @Price,
          Type = @Type,
          CategoryID = @CategoryID,
          SubCategoryID = @SubCategoryID,
          SupplierID = @SupplierID,
          IsHot = @IsHot,
          Image = COALESCE(@Image, Image),
          IsHidden = 0,
          UpdatedAt = @UpdatedAt
        WHERE ProductID = @ProductID
      `);

    const detailRequest = new sql.Request(transaction);
    await detailRequest
      .input("IDDetail", sql.NVarChar(50), DetailID)
      .input("ProductDescription", sql.NVarChar(sql.MAX), ProductDescription ?? null)
      .input("Ingredient", sql.NVarChar(sql.MAX), Ingredients ?? null)
      .input("Usage", sql.NVarChar(sql.MAX), Usage ?? null)
      .input("HowToUse", sql.NVarChar(sql.MAX), Instructions ?? null)
      .query(`
        UPDATE PRODUCT_DETAIL
        SET
          ProductDescription = @ProductDescription,
          Ingredient = @Ingredient,
          Usage = @Usage,
          HowToUse = @HowToUse
        WHERE IDDetail = @IDDetail
      `);

    await createAutoBatchForProduct(transaction, {
      productId: ProductID,
      batchId: String(BatchID || "").trim(),
      batchDetails: Array.isArray(BatchDetails) ? BatchDetails : [],
      deactivateMissingLots: true,
      note: `Lô cập nhật từ sản phẩm ${ProductID}`,
    });

    await transaction.commit();
    return { success: true, message: `Cập nhật sản phẩm ${ProductID} thành công` };
  } catch (err) {
    if (transaction._aborted !== true) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error("❌ Rollback thất bại khi update từ form thêm:", rollbackErr);
      }
    }

    console.error("❌ Lỗi updateProductFromAddFormDB:", err);
    return {
      success: false,
      message: "Lỗi khi cập nhật sản phẩm từ form thêm",
      error: err.message,
    };
  }
};


// =========================================================================================
// =========================THÊM MỚI SẢN PHẨM====================
/**
 * Hàm thêm sản phẩm mới
 * @param {object} product - Thông tin sản phẩm
 * @returns {Promise<object>} - Kết quả thêm
 */

exports.addProductDB = async (product) => {
  
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  try {
    const productId = (product.ProductID || "").trim();
    const incomingBatchDetails = Array.isArray(product.BatchDetails) ? product.BatchDetails : [];
    const batchBarcodes = Array.from(
      new Set(
        incomingBatchDetails
          .map((batch) => String(batch?.barcode || "").trim())
          .filter(Boolean),
      ),
    );

    if (!productId) {
      return { success: false, message: "Thiếu mã sản phẩm" };
    }

    if (batchBarcodes.length === 0) {
      return { success: false, message: "Thiếu Barcode trong lô hàng" };
    }

    // 🧠 1. Kiểm tra trùng ProductID trong nhóm IsHidden = 0 (false)
    const productConflict = await exports.checkHiddenProductConflictForAdd(productId, "");
    if (productConflict.isDuplicateProductID) {
      return {
        success: false,
        message: "ID sản phẩm đã tồn tại",
      };
    }

    // 🧠 2. Barcode phải duy nhất toàn hệ thống và được lưu ở BATCH_DETAIL
    for (const batchBarcode of batchBarcodes) {
      const barcodeConflict = await exports.checkHiddenProductConflictForAdd(productId, batchBarcode);
      if (barcodeConflict.isDuplicateBarcode) {
        return {
          success: false,
          message: `Barcode ${batchBarcode} đã tồn tại trên một sản phẩm khác`,
        };
      }
    }

    // Chuẩn hóa dữ liệu sau khi kiểm tra
    product.ProductID = productId;

    // ✅ Bắt đầu transaction
    await transaction.begin();

    const {
      ProductID, ProductName, Price, Type, CategoryID, SubCategoryID,
      SupplierID, IsHot, IsHidden, ProductDescription, Usage, Ingredients,
      Instructions, Image, DetailID, SubCategoryName, CreatedAt, UpdatedAt, BatchDetails
    } = product;

    // 🟩 2. Insert PRODUCT
    const productRequest = new sql.Request(transaction);
    await productRequest
      .input("ProductID", sql.VarChar(50), ProductID)
      .input("ProductName", sql.NVarChar(sql.MAX), ProductName)
      .input("DetailID", sql.NVarChar(50), DetailID)
      .input("IsHot", sql.TinyInt, IsHot ?? 0)
      .input("Type", sql.NVarChar(100), Type ?? null)
      .input("Price", sql.Int, Price ?? 0)
      .input("CategoryID", sql.NVarChar(100), CategoryID ?? null)
      .input("SupplierID", sql.NVarChar(100), SupplierID ?? null)
      .input("SubCategoryID", sql.NVarChar(50), SubCategoryID)
      .input("Image", sql.NVarChar(sql.MAX), Image ?? null)
      .input("IsHidden", sql.TinyInt, IsHidden ?? 0)
      .input("CreatedAt", sql.DateTime, CreatedAt ?? new Date())
      .input("UpdatedAt", sql.DateTime, UpdatedAt ?? new Date())
      .query(`
        INSERT INTO PRODUCT
        (ProductID, ProductName, Price, Type, CategoryID, SupplierID, SubCategoryID, IsHot, IsHidden, Image, DetailID, CreatedAt, UpdatedAt)
        VALUES
        (@ProductID, @ProductName, @Price, @Type, @CategoryID, @SupplierID, @SubCategoryID, @IsHot, @IsHidden, @Image, @DetailID, @CreatedAt, @UpdatedAt)
      `);

    // 🟩 3. Insert PRODUCT_DETAIL
    const detailRequest = new sql.Request(transaction);
    await detailRequest
      .input("IDDetail", sql.NVarChar(50), DetailID)
      .input("ProductDescription", sql.NVarChar(sql.MAX), ProductDescription ?? null)
      .input("Ingredient", sql.NVarChar(sql.MAX), Ingredients ?? null)
      .input("Usage", sql.NVarChar(sql.MAX), Usage ?? null)
      .input("HowToUse", sql.NVarChar(sql.MAX), Instructions ?? null)
      .query(`
        INSERT INTO PRODUCT_DETAIL
        (IDDetail, ProductDescription, Ingredient, Usage, HowToUse)
        VALUES
        (@IDDetail, @ProductDescription, @Ingredient, @Usage, @HowToUse)
      `);

    // 🟩 4. Insert SUB_CATEGORY nếu chưa có
    const subCategoryRequest = new sql.Request(transaction);
    await subCategoryRequest
      .input("SubCatID", sql.NVarChar(50), SubCategoryID)
      .input("SubCatName", sql.NVarChar(100), SubCategoryName ?? null)
      .input("SubCatCategoryID", sql.NVarChar(50), CategoryID)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM SUB_CATEGORY WHERE SubCategoryID = @SubCatID)
        BEGIN
          INSERT INTO SUB_CATEGORY (SubCategoryID, CategoryID, SubCategoryName)
          VALUES (@SubCatID, @SubCatCategoryID, @SubCatName)
        END
      `);

    // 🟩 5. Tự động tạo lô hàng đầu tiên theo barcode + số lượng khi thêm sản phẩm
    await createAutoBatchForProduct(transaction, {
      productId: ProductID,
      batchId: String(product.BatchID || "").trim(),
      batchDetails: Array.isArray(BatchDetails) ? BatchDetails : [],
      note: `Lô tự động từ thêm sản phẩm ${ProductID}`,
    });

    // ✅ Commit nếu thành công
    await transaction.commit();
    return { success: true, message: `Thêm sản phẩm ${ProductName} thành công` };
  } catch (err) {
    // ✅ Rollback an toàn
    if (transaction._aborted !== true) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error("❌ Rollback thất bại:", rollbackErr);
      }
    }

    console.error("❌ Transaction rollback do lỗi:", err);
    return {
      success: false,
      message: "Lỗi khi thêm sản phẩm, đã rollback",
      error: err.message,
    };
  }
};

// =========================ẨN SẢN PHẨM (SOFT DELETE)====================
/**
 * Ẩn danh sách sản phẩm bằng cách set IsHidden = 1
 * @param {string[]} productIds - Danh sách ProductID cần ẩn
 * @returns {Promise<object>} - Kết quả cập nhật
 */
exports.hideProductsByIds = async (productIds) => {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return { success: false, message: "Danh sách sản phẩm cần ẩn không hợp lệ" };
    }

    const pool = await connectDB();
    const request = pool.request();

    const placeholders = productIds.map((id, index) => {
      const key = `ProductID_${index}`;
      request.input(key, sql.VarChar(50), id);
      return `@${key}`;
    });

    const result = await request.query(`
      UPDATE PRODUCT
      SET IsHidden = 1,
          UpdatedAt = GETDATE()
      WHERE ProductID IN (${placeholders.join(", ")})
        AND IsHidden = 0
    `);

    return {
      success: true,
      affectedRows: result.rowsAffected?.[0] || 0,
      message: "Ẩn sản phẩm thành công",
    };
  } catch (error) {
    console.error("❌ Lỗi khi ẩn sản phẩm:", error.message);
    return {
      success: false,
      message: "Lỗi khi ẩn sản phẩm",
      error: error.message,
    };
  }
};

// =========================LẤY DANH SÁCH LÔ HÀNG CỦA SẢN PHẨM====================
/**
 * Lấy danh sách dòng lô hàng theo ProductID để hiển thị ở trang chi tiết sản phẩm.
 * Ưu tiên join BATCHES để lấy CreatedAt; nếu schema join khác, fallback về dữ liệu BATCH_DETAIL.
 * @param {string} productId - Mã sản phẩm
 * @returns {Promise<Array>} - Danh sách lô hàng
 */
exports.getBatchDetailsByProductId = async (productId) => {
  try {
    const pool = await connectDB();

    let rows = [];
    try {
      const withJoin = await pool.request()
        .input("ProductID", sql.VarChar(50), productId)
        .query(`
          SELECT
            BD.*,
            B.CreatedAt AS BatchCreatedAt,
            B.Note AS BatchNote
          FROM BATCH_DETAIL BD
          LEFT JOIN BATCHES B ON B.ID = BD.BatchID
          WHERE BD.ProductID = @ProductID
            AND ISNULL(BD.IsActive, 1) = 1
          ORDER BY B.CreatedAt DESC
        `);
      rows = withJoin.recordset || [];
    } catch (joinError) {
      console.warn("⚠️ Join BATCHES thất bại, fallback BATCH_DETAIL:", joinError.message);
      const fallback = await pool.request()
        .input("ProductID", sql.VarChar(50), productId)
        .query(`
          SELECT *
          FROM BATCH_DETAIL
          WHERE ProductID = @ProductID
            AND ISNULL(IsActive, 1) = 1
        `);
      rows = fallback.recordset || [];
    }

    return rows.map((row, index) => ({
      batchId: row.BatchID || row.BatchId || row.IDBatch || row.BatchDetailID || row.ID || row.Id || `ROW_${index + 1}`,
      barcode: row.Barcode || "",
      quantity: Number(row.Quantity || 0),
      createdAt: row.BatchCreatedAt || row.CreatedAt || null,
      expiryDate: row.ExpiryDate || row.ExpiredDate || row.ExpireDate || null,
      note: row.BatchNote || row.Note || "",
    }));
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách lô hàng theo sản phẩm:", error.message);
    return [];
  }
};

// =========================CẬP NHẬT CHI TIẾT SẢN PHẨM + LÔ HÀNG====================
exports.updateProductDetailAndBatches = async (payload) => {
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const {
      ProductID,
      ProductName,
      Price,
      CategoryID,
      SubCategoryID,
      ProductDescription,
      Ingredient,
      Usage,
      HowToUse,
      DetailID,
      batchDetails = [],
    } = payload;

    if (!ProductID) {
      throw new Error("Thiếu ProductID khi cập nhật chi tiết sản phẩm");
    }

    await new sql.Request(transaction)
      .input("ProductID", sql.VarChar(50), ProductID)
      .input("ProductName", sql.NVarChar(sql.MAX), ProductName ?? null)
      .input("Price", sql.Int, Price ?? null)
      .input("CategoryID", sql.NVarChar(100), CategoryID ?? null)
      .input("SubCategoryID", sql.NVarChar(100), SubCategoryID ?? null)
      .query(`
        UPDATE PRODUCT
        SET ProductName = COALESCE(@ProductName, ProductName),
            Price = COALESCE(@Price, Price),
            CategoryID = COALESCE(@CategoryID, CategoryID),
            SubCategoryID = @SubCategoryID,
            UpdatedAt = GETDATE()
        WHERE ProductID = @ProductID
      `);

    if (DetailID) {
      await new sql.Request(transaction)
        .input("IDDetail", sql.NVarChar(50), DetailID)
        .input("ProductDescription", sql.NVarChar(sql.MAX), ProductDescription ?? null)
        .input("Ingredient", sql.NVarChar(sql.MAX), Ingredient ?? null)
        .input("Usage", sql.NVarChar(sql.MAX), Usage ?? null)
        .input("HowToUse", sql.NVarChar(sql.MAX), HowToUse ?? null)
        .query(`
          UPDATE PRODUCT_DETAIL
          SET ProductDescription = @ProductDescription,
              Ingredient = @Ingredient,
              Usage = @Usage,
              HowToUse = @HowToUse
          WHERE IDDetail = @IDDetail
        `);
    }

    if (Array.isArray(batchDetails) && batchDetails.length > 0) {
      const meta = await new sql.Request(transaction).query(`
        SELECT
          CASE
            WHEN COL_LENGTH('BATCH_DETAIL', 'BatchID') IS NOT NULL THEN 'BatchID'
            WHEN COL_LENGTH('BATCH_DETAIL', 'BatchId') IS NOT NULL THEN 'BatchId'
            WHEN COL_LENGTH('BATCH_DETAIL', 'IDBatch') IS NOT NULL THEN 'IDBatch'
            WHEN COL_LENGTH('BATCH_DETAIL', 'BatchDetailID') IS NOT NULL THEN 'BatchDetailID'
            WHEN COL_LENGTH('BATCH_DETAIL', 'ID') IS NOT NULL THEN 'ID'
            WHEN COL_LENGTH('BATCH_DETAIL', 'Id') IS NOT NULL THEN 'Id'
            ELSE NULL
          END AS KeyColumn,
          CASE
            WHEN COL_LENGTH('BATCH_DETAIL', 'ExpiryDate') IS NOT NULL THEN 'ExpiryDate'
            WHEN COL_LENGTH('BATCH_DETAIL', 'ExpiredDate') IS NOT NULL THEN 'ExpiredDate'
            WHEN COL_LENGTH('BATCH_DETAIL', 'ExpireDate') IS NOT NULL THEN 'ExpireDate'
            ELSE NULL
          END AS ExpiryColumn
      `);

      const keyColumn = meta.recordset?.[0]?.KeyColumn;
      const expiryColumn = meta.recordset?.[0]?.ExpiryColumn;

      if (!keyColumn) {
        throw new Error("Không tìm thấy cột khóa của BATCH_DETAIL để cập nhật");
      }

      for (const batch of batchDetails) {
        const rawBatchId = String(batch?.batchId || "").trim();
        if (!rawBatchId || /^ROW_\d+$/i.test(rawBatchId)) {
          continue;
        }

        const request = new sql.Request(transaction)
          .input("ProductID", sql.VarChar(50), ProductID)
          .input("BatchID", sql.NVarChar(100), rawBatchId)
          .input("Barcode", sql.VarChar(100), batch?.barcode ?? null)
          .input("Quantity", sql.Int, Number(batch?.quantity || 0));

        const setParts = ["Barcode = @Barcode", "Quantity = @Quantity"];
        if (expiryColumn) {
          request.input("ExpiryDate", sql.Date, batch?.expiryDate ? new Date(batch.expiryDate) : null);
          setParts.push(`[${expiryColumn}] = @ExpiryDate`);
        }

        await request.query(`
          UPDATE BATCH_DETAIL
          SET ${setParts.join(", ")}
          WHERE ProductID = @ProductID
            AND [${keyColumn}] = @BatchID
            AND ISNULL(IsActive, 1) = 1
        `);
      }
    }

    await transaction.commit();
    return { success: true, message: "Cập nhật sản phẩm và lô hàng thành công" };
  } catch (error) {
    if (transaction._aborted !== true) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error("❌ Rollback lỗi khi cập nhật chi tiết sản phẩm:", rollbackErr.message);
      }
    }

    console.error("❌ Lỗi updateProductDetailAndBatches:", error.message);
    return { success: false, message: "Lỗi cập nhật chi tiết sản phẩm", error: error.message };
  }
};
