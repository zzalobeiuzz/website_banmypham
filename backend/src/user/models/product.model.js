const { connectDB, resetDBPool } = require("../../config/connect");

// ===============ĐỒNG BỘ LÔ HẾT HẠN===============
exports.syncExpiredBatchDetailsStatus = async () => {
  const syncQuery = `
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
    `;

  try {
    const pool = await connectDB();
    const result = await pool.request().query(syncQuery);

    return Number(result.recordset?.[0]?.UpdatedRows || 0);
  } catch (error) {
    const message = String(error?.message || "");
    const isClosedConnection =
      /connection\s+is\s+closed|connection\s+not\s+yet\s+open|pool\s+is\s+not\s+open/i.test(
        message,
      );

    if (isClosedConnection) {
      try {
        console.warn(
          "⚠️ Pool đang đóng, thử reconnect để đồng bộ lô hết hạn...",
        );
        await resetDBPool();
        const retryPool = await connectDB();
        const retryResult = await retryPool.request().query(syncQuery);
        return Number(retryResult.recordset?.[0]?.UpdatedRows || 0);
      } catch (retryError) {
        console.error(
          "❌ Retry đồng bộ lô hết hạn thất bại:",
          retryError.message,
        );
        return 0;
      }
    }

    console.error("❌ Lỗi đồng bộ lô hết hạn phía user:", error.message);
    return 0;
  }
};

//===============TRUY VẤN SẢN PHẨM SALE===============
exports.findSaleProducts = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT 
      PS.id AS ProductSaleID,
      P.ProductID,
      P.ProductName,
      P.SupplierID,
      P.Price,
      P.Image,
      -- 📦 Tồn kho = tổng số lượng còn lại của tất cả lô trong BATCH_DETAIL
      ISNULL(BDQ.StockQuantity, 0) AS StockQuantity,
      PS.sale_price,
      PS.start_date,
      PS.end_date,
      PS.SaleEventID,
      PS.ProgramName,
      SE.code AS SaleEventCode,
      SE.title AS SaleEventTitle
    FROM PRODUCT_SALE PS
    JOIN PRODUCT P ON PS.product_id = P.ProductID
    LEFT JOIN SALE_EVENT SE ON SE.id = PS.SaleEventID
    LEFT JOIN (
      SELECT ProductID, SUM(CAST(Quantity AS INT)) AS StockQuantity
      FROM BATCH_DETAIL
      WHERE ISNULL(IsActive, 1) = 1
      GROUP BY ProductID
    ) BDQ ON BDQ.ProductID = P.ProductID
    WHERE (P.IsHidden = 0 OR P.IsHidden IS NULL)
      AND ISNULL(PS.status, 1) = 1
      AND (PS.start_date IS NULL OR PS.start_date <= GETDATE())
      AND (PS.end_date IS NULL OR PS.end_date >= GETDATE());
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
    -- 📦 Tồn kho = tổng số lượng còn lại của tất cả lô trong BATCH_DETAIL
    ISNULL(BDQ.StockQuantity, 0) AS StockQuantity,
    PS.id AS ProductSaleID,
    PS.sale_price,       -- Lấy giá khuyến mãi từ bảng PRODUCT_SALE nếu 
    PS.start_date,
    PS.end_date,
    PS.SaleEventID,
    PS.ProgramName,
    SE.code AS SaleEventCode,
    SE.title AS SaleEventTitle
    FROM PRODUCT P
    OUTER APPLY (
      SELECT TOP 1 *
      FROM PRODUCT_SALE PS
      WHERE PS.product_id = P.ProductID
        AND ISNULL(PS.status, 1) = 1
        AND (PS.start_date IS NULL OR PS.start_date <= GETDATE())
        AND (PS.end_date IS NULL OR PS.end_date >= GETDATE())
      ORDER BY PS.created_at DESC, PS.id DESC
    ) PS
    LEFT JOIN SALE_EVENT SE ON SE.id = PS.SaleEventID
    LEFT JOIN (
      SELECT ProductID, SUM(CAST(Quantity AS INT)) AS StockQuantity
      FROM BATCH_DETAIL
      WHERE ISNULL(IsActive, 1) = 1
      GROUP BY ProductID
    ) BDQ ON BDQ.ProductID = P.ProductID
    WHERE P.isHot = 1
      AND (P.IsHidden = 0 OR P.IsHidden IS NULL);
  `);
  return result.recordset;
};

// ===============TRUY VẤN THƯƠNG HIỆU NỔI BẬT===============
//===============TRUY VAN SAN PHAM THUOC 3 LO HANG MOI NHAT===============
exports.findNewArrivalProducts = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    WITH LatestBatches AS (
      SELECT TOP 3
        ID,
        CreatedAt
      FROM BATCHES
      WHERE IsActive = 1 OR IsActive IS NULL
      ORDER BY CreatedAt DESC, ID DESC
    ),
    ProductInLatestBatches AS (
      SELECT
        BD.ProductID,
        MAX(LB.CreatedAt) AS LatestBatchCreatedAt,
        MAX(BD.CreatedAt) AS LatestBatchDetailCreatedAt
      FROM BATCH_DETAIL BD
      INNER JOIN LatestBatches LB
        ON CAST(LB.ID AS NVARCHAR(100)) = CAST(BD.BatchID AS NVARCHAR(100))
      WHERE ISNULL(BD.IsActive, 1) = 1
        AND ISNULL(TRY_CAST(BD.Quantity AS INT), 0) > 0
      GROUP BY BD.ProductID
    )
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
      PS.end_date,
      NBP.LatestBatchCreatedAt
    FROM ProductInLatestBatches NBP
    INNER JOIN PRODUCT P
      ON CAST(P.ProductID AS NVARCHAR(100)) = CAST(NBP.ProductID AS NVARCHAR(100))
    LEFT JOIN CATEGORY C ON P.CategoryID = C.CategoryID
    LEFT JOIN SUB_CATEGORY SC ON P.SubCategoryID = SC.SubCategoryID
    OUTER APPLY (
      SELECT TOP 1
        BD.Barcode
      FROM BATCH_DETAIL BD
      INNER JOIN LatestBatches LB
        ON CAST(LB.ID AS NVARCHAR(100)) = CAST(BD.BatchID AS NVARCHAR(100))
      WHERE CAST(BD.ProductID AS NVARCHAR(100)) = CAST(P.ProductID AS NVARCHAR(100))
        AND ISNULL(BD.IsActive, 1) = 1
        AND ISNULL(BD.Barcode, '') <> ''
      ORDER BY LB.CreatedAt DESC, BD.CreatedAt DESC
    ) LOT
    LEFT JOIN (
      SELECT ProductID, SUM(TRY_CAST(Quantity AS INT)) AS StockQuantity
      FROM BATCH_DETAIL
      WHERE ISNULL(IsActive, 1) = 1
      GROUP BY ProductID
    ) BDQ ON CAST(BDQ.ProductID AS NVARCHAR(100)) = CAST(P.ProductID AS NVARCHAR(100))
    OUTER APPLY (
      SELECT TOP 1
        PS.sale_price,
        PS.start_date,
        PS.end_date
      FROM PRODUCT_SALE PS
      WHERE CAST(PS.product_id AS NVARCHAR(100)) = CAST(P.ProductID AS NVARCHAR(100))
        AND PS.status = 1
        AND (PS.start_date IS NULL OR PS.start_date <= GETDATE())
        AND (PS.end_date IS NULL OR PS.end_date >= GETDATE())
      ORDER BY PS.created_at DESC, PS.id DESC
    ) PS
    WHERE (P.IsHidden = 0 OR P.IsHidden IS NULL)
      AND (C.IsHidden = 0 OR C.IsHidden IS NULL)
      AND (SC.IsHidden = 0 OR SC.IsHidden IS NULL)
    ORDER BY NBP.LatestBatchCreatedAt DESC, NBP.LatestBatchDetailCreatedAt DESC, P.ProductID DESC
  `);

  return result.recordset || [];
};

//===============TRUY VAN XU HUONG LAM DEP THEO SO LUONG BAN RA===============
exports.findBeautyTrendProducts = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    WITH SoldProducts AS (
      SELECT
        CAST(D.ProductID AS NVARCHAR(100)) AS ProductID,
        SUM(ISNULL(TRY_CAST(D.Quantity AS INT), 0)) AS SoldQuantity,
        COUNT(DISTINCT CAST(D.OrderID AS NVARCHAR(100))) AS OrderCount,
        SUM(ISNULL(TRY_CAST(D.LineTotal AS DECIMAL(18,2)), 0)) AS Revenue
      FROM ORDER_DETAILS D
      LEFT JOIN ORDERS O
        ON CAST(O.OrderID AS NVARCHAR(100)) = CAST(D.OrderID AS NVARCHAR(100))
      WHERE ISNULL(NULLIF(LTRIM(RTRIM(CAST(D.ProductID AS NVARCHAR(100)))), ''), '') <> ''
        AND ISNULL(TRY_CAST(D.Quantity AS INT), 0) > 0
        AND (
          O.Status IS NULL
          OR (
            LOWER(CAST(O.Status AS NVARCHAR(255))) NOT LIKE N'%hủy%'
            AND LOWER(CAST(O.Status AS NVARCHAR(255))) NOT LIKE N'%huỷ%'
            AND LOWER(CAST(O.Status AS NVARCHAR(255))) NOT LIKE N'%trả%'
            AND LOWER(CAST(O.Status AS NVARCHAR(255))) NOT LIKE N'%chờ thanh toán%'
          )
        )
      GROUP BY CAST(D.ProductID AS NVARCHAR(100))
    ),
    RankedProducts AS (
      SELECT
        ROW_NUMBER() OVER (ORDER BY S.SoldQuantity DESC, S.OrderCount DESC, S.Revenue DESC) AS TrendRank,
        S.*
      FROM SoldProducts S
    )
    SELECT TOP 20
      R.TrendRank,
      R.SoldQuantity,
      R.OrderCount,
      R.Revenue,
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
    FROM RankedProducts R
    INNER JOIN PRODUCT P
      ON CAST(P.ProductID AS NVARCHAR(100)) = CAST(R.ProductID AS NVARCHAR(100))
    LEFT JOIN CATEGORY C ON P.CategoryID = C.CategoryID
    LEFT JOIN SUB_CATEGORY SC ON P.SubCategoryID = SC.SubCategoryID
    OUTER APPLY (
      SELECT TOP 1
        BD.Barcode
      FROM BATCH_DETAIL BD
      LEFT JOIN BATCHES B ON B.ID = BD.BatchID
      WHERE CAST(BD.ProductID AS NVARCHAR(100)) = CAST(P.ProductID AS NVARCHAR(100))
        AND ISNULL(BD.IsActive, 1) = 1
        AND (B.IsActive = 1 OR B.IsActive IS NULL)
        AND ISNULL(BD.Barcode, '') <> ''
      ORDER BY B.CreatedAt DESC, BD.CreatedAt DESC
    ) LOT
    LEFT JOIN (
      SELECT ProductID, SUM(TRY_CAST(Quantity AS INT)) AS StockQuantity
      FROM BATCH_DETAIL
      WHERE ISNULL(IsActive, 1) = 1
      GROUP BY ProductID
    ) BDQ ON CAST(BDQ.ProductID AS NVARCHAR(100)) = CAST(P.ProductID AS NVARCHAR(100))
    OUTER APPLY (
      SELECT TOP 1
        PS.sale_price,
        PS.start_date,
        PS.end_date
      FROM PRODUCT_SALE PS
      WHERE CAST(PS.product_id AS NVARCHAR(100)) = CAST(P.ProductID AS NVARCHAR(100))
        AND PS.status = 1
        AND (PS.start_date IS NULL OR PS.start_date <= GETDATE())
        AND (PS.end_date IS NULL OR PS.end_date >= GETDATE())
      ORDER BY PS.created_at DESC, PS.id DESC
    ) PS
    WHERE (P.IsHidden = 0 OR P.IsHidden IS NULL)
      AND (C.IsHidden = 0 OR C.IsHidden IS NULL)
      AND (SC.IsHidden = 0 OR SC.IsHidden IS NULL)
    ORDER BY R.TrendRank ASC
  `);

  return result.recordset || [];
};

exports.findFeaturedBrands = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT TOP 12
      B.idBrand,
      B.Brand,
      B.logo_url,
      NULL AS preview_image
    FROM BRAND B
    WHERE ISNULL(B.status, 0) = 1
      AND ISNULL(NULLIF(LTRIM(RTRIM(CAST(B.logo_url AS NVARCHAR(MAX)))), ''), '') <> ''
    ORDER BY B.idBrand DESC
  `);

  return result.recordset || [];
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
    const subCategoryResult = await pool.request().query(`
        SELECT * FROM SUB_CATEGORY
        WHERE IsHidden = 0 OR IsHidden IS NULL
      `);

    const categories = categoryResult.recordset.map((category) => {
      const subCategories = subCategoryResult.recordset.filter(
        (sub) => sub.CategoryID === category.CategoryID,
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
          -- 📦 Tồn kho được tính bằng tổng Quantity còn lại ở các lô trong BATCH_DETAIL
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

// ===============TRUY VẤN CHI TIẾT 1 MẢNG SẢN PHẨM THEO PRODUCTID===============
exports.findProductDetailById = async (productIds) => {
  try {
    const pool = await connectDB();

    // 👉 luôn đảm bảo là array
    const ids = Array.isArray(productIds) ? productIds : [productIds];

    // 👉 tạo list param @id0, @id1, @id2...
    const request = pool.request();

    const idParams = ids.map((id, index) => {
      const paramName = `id${index}`;
      request.input(paramName, id);
      return `@${paramName}`;
    });

    const query = `
          SELECT
          P.*,

          -- 📦 tồn kho
          ISNULL(BDQ.StockQuantity, 0) AS StockQuantity,

          -- 📂 category
          C.CategoryName,
          SC.SubCategoryName,

          -- 📄 detail
          D.Usage,
          D.Ingredient,
          D.ProductDescription,
          D.HowToUse,

          -- 🔥 sale
          PS.sale_price,
          PS.start_date,
          PS.end_date,
          PS.status AS sale_status

      FROM PRODUCT P

      LEFT JOIN CATEGORY C 
          ON P.CategoryID = C.CategoryID

      LEFT JOIN SUB_CATEGORY SC 
          ON P.SubCategoryID = SC.SubCategoryID

      LEFT JOIN (
          SELECT 
              ProductID,
              SUM(CAST(Quantity AS INT)) AS StockQuantity
          FROM BATCH_DETAIL BD
          LEFT JOIN BATCHES B 
              ON B.ID = BD.BatchID
          WHERE ISNULL(BD.IsActive, 1) = 1
            AND (B.IsActive = 1 OR B.IsActive IS NULL)
          GROUP BY ProductID
      ) BDQ 
          ON BDQ.ProductID = P.ProductID

      LEFT JOIN Product_Detail D 
          ON P.DetailID = D.IDDetail

      -- 🔥 JOIN SALE
      LEFT JOIN PRODUCT_SALE PS
          ON PS.product_id = P.ProductID
        AND PS.status = 1
        AND (
              PS.start_date IS NULL 
              OR PS.start_date <= GETDATE()
        )
        AND (
              PS.end_date IS NULL
              OR PS.end_date >= GETDATE()
        )

      WHERE P.ProductID IN (${idParams.join(",")})
        AND (P.IsHidden = 0 OR P.IsHidden IS NULL)
        AND (C.IsHidden = 0 OR C.IsHidden IS NULL)
        AND (SC.IsHidden = 0 OR SC.IsHidden IS NULL)
    `;

    const result = await request.query(query);

    return result.recordset || [];
  } catch (error) {
    console.error("❌ Lỗi findProductDetailById:", error.message);
    throw error;
  }
};

// ===============TRUY VẤN BATCH THEO PRODUCT ID (SINGLE & MULTIPLE)===============
exports.findBatchDetailsByProductId = async (input) => {
  try {
    const pool = await connectDB();

    // 👉 luôn convert về array
    const ids = Array.isArray(input) ? input : [input];

    if (!ids.length) return {};

    const request = pool.request();

    // 👉 tạo param @id0, @id1...
    const idParams = ids.map((id, index) => {
      const key = `id${index}`;
      request.input(key, id);
      return `@${key}`;
    });

    const result = await request.query(`
      SELECT
        BD.*,
        B.CreatedAt AS BatchCreatedAt,
        B.Note AS BatchNote
      FROM BATCH_DETAIL BD
      LEFT JOIN BATCHES B ON B.ID = BD.BatchID
      WHERE BD.ProductID IN (${idParams.join(",")})
        AND ISNULL(BD.IsActive, 1) = 1
        AND (B.IsActive = 1 OR B.IsActive IS NULL)
      ORDER BY B.CreatedAt DESC
    `);

    // 👉 group theo ProductID
    const grouped = {};

    (result.recordset || []).forEach((row, index) => {
      const productId = row.ProductID;

      if (!grouped[productId]) {
        grouped[productId] = [];
      }

      grouped[productId].push({
        batchId:
          row.BatchID ||
          row.BatchId ||
          row.IDBatch ||
          row.BatchDetailID ||
          row.ID ||
          row.Id ||
          `ROW_${index + 1}`,
        barcode: row.Barcode || "",
        quantity: Number(row.Quantity || 0),
        createdAt: row.BatchCreatedAt || row.CreatedAt || null,
        expiryDate: row.ExpiryDate || row.ExpiredDate || row.ExpireDate || null,
        note: row.BatchNote || row.Note || "",
      });
    });

    return grouped;
  } catch (error) {
    console.error("❌ Lỗi findBatchDetailsByProductId:", error.message);
    return {};
  }
};

// ===============TRUY VẤN CHI TIẾT THƯƠNG HIỆU + DANH SÁCH SẢN PHẨM===============
exports.findBrandDetailWithProducts = async (idBrand) => {
  const pool = await connectDB();
  const brandId = String(idBrand || "").trim();

  if (!brandId) {
    return {
      brand: null,
      products: [],
    };
  }

  const brandResult = await pool.request().input("idBrand", brandId).query(`
      SELECT TOP 1
        idBrand,
        Brand,
        description,
        status,
        logo_url
      FROM BRAND
      WHERE idBrand = @idBrand
    `);

  const productResult = await pool.request().input("idBrand", brandId).query(`
      SELECT
        P.ProductID,
        P.ProductName,
        P.SupplierID,
        P.Price,
        P.Image,
        P.isHot,
        -- 📦 Tồn kho = tổng số lượng còn lại của tất cả lô trong BATCH_DETAIL
        ISNULL(BDQ.StockQuantity, 0) AS StockQuantity,
        P.CategoryID,
        P.SubCategoryID,
        C.CategoryName,
        SC.SubCategoryName,
        PS.sale_price,
        PS.start_date,
        PS.end_date
      FROM PRODUCT P
      LEFT JOIN PRODUCT_SALE PS ON P.ProductID = PS.product_id
      LEFT JOIN CATEGORY C ON P.CategoryID = C.CategoryID
      LEFT JOIN SUB_CATEGORY SC ON P.SubCategoryID = SC.SubCategoryID
      LEFT JOIN (
        SELECT ProductID, SUM(CAST(Quantity AS INT)) AS StockQuantity
        FROM BATCH_DETAIL
        WHERE ISNULL(IsActive, 1) = 1
        GROUP BY ProductID
      ) BDQ ON BDQ.ProductID = P.ProductID
      WHERE P.SupplierID = @idBrand
        AND (P.IsHidden = 0 OR P.IsHidden IS NULL)
        AND (C.IsHidden = 0 OR C.IsHidden IS NULL)
        AND (SC.IsHidden = 0 OR SC.IsHidden IS NULL)
      ORDER BY P.ProductID DESC
    `);

  return {
    brand: brandResult.recordset?.[0] || null,
    products: productResult.recordset || [],
  };
};
