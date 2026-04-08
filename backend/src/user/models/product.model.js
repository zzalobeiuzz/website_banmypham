const { connectDB } = require("../../config/connect");

// ===============ĐỒNG BỘ LÔ HẾT HẠN===============
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
    console.error("❌ Lỗi đồng bộ lô hết hạn phía user:", error.message);
    return 0;
  }
};

//===============TRUY VẤN SẢN PHẨM SALE===============
exports.findSaleProducts = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT 
      P.ProductID,
      P.ProductName,
      P.SupplierID,
      P.Price,
      P.Image,
      PS.sale_price,
      PS.start_date,
      PS.end_date
    FROM PRODUCT_SALE PS
    JOIN PRODUCT P ON PS.product_id = P.ProductID
    WHERE (P.IsHidden = 0 OR P.IsHidden IS NULL);
  `);
  return result.recordset;
};

//===============TRUY VẤN SẢN PHẨM HOT===============
exports.findHotProducts = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT 
    P.ProductID,         -- Lấy mã sản phẩm từ bảng PRODUCT
    P.ProductName,       -- Lấy tên sản phẩm
    P.SupplierID,        -- Lấy mã nhà cung cấp
    P.Price,             -- Lấy giá gốc sản phẩm
    P.Image,             -- Lấy ảnh sản phẩm
    P.isHot,             -- Lấy trạng thái "hot" (1 = sản phẩm hot)
    PS.sale_price        -- Lấy giá khuyến mãi từ bảng PRODUCT_SALE nếu 
    FROM PRODUCT P
    LEFT JOIN PRODUCT_SALE PS ON P.ProductID = PS.product_id
    WHERE P.isHot = 1
      AND (P.IsHidden = 0 OR P.IsHidden IS NULL);
  `);
  return result.recordset;
};
// ===============TRUY VẤN DANH MỤC SẢN PHẨM===============
exports.findCategories = async () => {
  try {
    const pool = await connectDB();

    // Lấy tất cả category chưa bị ẩn
    const categoryResult = await pool.request().query(`
      SELECT * FROM Category
      WHERE IsHidden = 0 OR IsHidden IS NULL
    `);

    // Lấy tất cả sub-category chưa bị ẩn
    const subCategoryResult = await pool
      .request()
      .query(`
        SELECT * FROM SUB_CATEGORY
        WHERE IsHidden = 0 OR IsHidden IS NULL
      `);

    const categories = categoryResult.recordset.map((category) => {
      const subCategories = subCategoryResult.recordset.filter(
        (sub) => sub.CategoryID === category.CategoryID
      );
      return {
        ...category,
        SubCategories: subCategories,
      };
    });

    return categories;
  } catch (err) {
    console.error("❌ Lỗi truy vấn Category và Sub_Category:", err);
    throw err;
  }
};
// ===============TRUY VẤN TẤT CẢ SẢN PHẨM (CÓ HOẶC KHÔNG CÓ SALE)===============
exports.findAllProducts = async () => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
          SELECT 
          P.ProductID,
          P.ProductName,
              LOT.Barcode,
          P.Type,
          P.SupplierID,
          P.Price,
          P.Image,
          P.isHot,
          ISNULL(BDQ.StockQuantity, 0) AS StockQuantity,
          P.CategoryID,
          P.SubCategoryID,
          P.IsHidden,
          C.CategoryName,
          SC.SubCategoryName,
          PS.sale_price,
          PS.start_date,
          PS.end_date
      FROM PRODUCT P
      LEFT JOIN PRODUCT_SALE PS ON P.ProductID = PS.product_id
      LEFT JOIN CATEGORY C ON P.CategoryID = C.CategoryID
      LEFT JOIN SUB_CATEGORY SC ON P.SubCategoryID = SC.SubCategoryID
      OUTER APPLY (
        SELECT TOP 1
          BD.Barcode
        FROM BATCH_DETAIL BD
        LEFT JOIN BATCHES B ON B.ID = BD.BatchID
        WHERE BD.ProductID = P.ProductID
          AND ISNULL(BD.IsActive, 1) = 1
          AND (B.IsActive = 1 OR B.IsActive IS NULL)
          AND ISNULL(BD.Barcode, '') <> ''
        ORDER BY B.CreatedAt DESC, BD.CreatedAt DESC
      ) LOT
      LEFT JOIN (
        SELECT ProductID, SUM(CAST(Quantity AS INT)) AS StockQuantity
        FROM BATCH_DETAIL
        WHERE ISNULL(IsActive, 1) = 1
        GROUP BY ProductID
      ) BDQ ON BDQ.ProductID = P.ProductID
      WHERE (P.IsHidden = 0 OR P.IsHidden IS NULL)
        AND (C.IsHidden = 0 OR C.IsHidden IS NULL)
        AND (SC.IsHidden = 0 OR SC.IsHidden IS NULL)
    `);

    return result.recordset;
  } catch (err) {
    console.error("❌ Lỗi khi lấy tất cả sản phẩm:", err);
    throw err;
  }
};

// ===============TRUY VẤN CHI TIẾT SẢN PHẨM THEO PRODUCTID===============
exports.findProductDetailById = async (productId) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("ProductID", productId)
      .query(`
        SELECT
          P.*,
          ISNULL(BDQ.StockQuantity, 0) AS StockQuantity,
          C.CategoryName,
          SC.SubCategoryName,
          D.Usage,
          D.Ingredient,
          D.ProductDescription,
          D.HowToUse
        FROM PRODUCT P
        LEFT JOIN CATEGORY C ON P.CategoryID = C.CategoryID
        LEFT JOIN SUB_CATEGORY SC ON P.SubCategoryID = SC.SubCategoryID
        LEFT JOIN (
          SELECT ProductID, SUM(CAST(Quantity AS INT)) AS StockQuantity
          FROM BATCH_DETAIL BD
          LEFT JOIN BATCHES B ON B.ID = BD.BatchID
          WHERE ISNULL(BD.IsActive, 1) = 1
            AND (B.IsActive = 1 OR B.IsActive IS NULL)
          GROUP BY ProductID
        ) BDQ ON BDQ.ProductID = P.ProductID
        LEFT JOIN Product_Detail D ON P.DetailID = D.IDDetail
        WHERE P.ProductID = @ProductID
          AND (P.IsHidden = 0 OR P.IsHidden IS NULL)
          AND (C.IsHidden = 0 OR C.IsHidden IS NULL)
          AND (SC.IsHidden = 0 OR SC.IsHidden IS NULL)
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("❌ Lỗi findProductDetailById:", error.message);
    throw error;
  }
};

// ===============TRUY VẤN DANH SÁCH LÔ HÀNG THEO PRODUCTID===============
exports.findBatchDetailsByProductId = async (productId) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("ProductID", productId)
      .query(`
        SELECT
          BD.*,
          B.CreatedAt AS BatchCreatedAt,
          B.Note AS BatchNote
        FROM BATCH_DETAIL BD
        LEFT JOIN BATCHES B ON B.ID = BD.BatchID
        WHERE BD.ProductID = @ProductID
          AND ISNULL(BD.IsActive, 1) = 1
          AND (B.IsActive = 1 OR B.IsActive IS NULL)
        ORDER BY B.CreatedAt DESC
      `);

    return (result.recordset || []).map((row, index) => ({
      batchId: row.BatchID || row.BatchId || row.IDBatch || row.BatchDetailID || row.ID || row.Id || `ROW_${index + 1}`,
      barcode: row.Barcode || "",
      quantity: Number(row.Quantity || 0),
      createdAt: row.BatchCreatedAt || row.CreatedAt || null,
      expiryDate: row.ExpiryDate || row.ExpiredDate || row.ExpireDate || null,
      note: row.BatchNote || row.Note || "",
    }));
  } catch (error) {
    console.error("❌ Lỗi findBatchDetailsByProductId:", error.message);
    return [];
  }
};
