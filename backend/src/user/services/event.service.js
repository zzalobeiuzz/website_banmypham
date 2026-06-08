const { connectDB, sql } = require("../../config/connect");

const parseJsonObject = (value) => {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const getMetadataValue = (metadata, key) => {
  const matchedKey = Object.keys(metadata || {}).find(
    (item) => String(item).toLowerCase() === String(key).toLowerCase(),
  );
  return matchedKey ? metadata[matchedKey] : undefined;
};

const getHomeBannerSlot = (metadata) => {
  const section = String(getMetadataValue(metadata, "homeBannerSection") || "").trim().toLowerCase();
  const position = String(getMetadataValue(metadata, "homeBannerPosition") || "").trim().toLowerCase();

  if ((section === "main" && position === "center") || position === "main" || position === "banner-slide") {
    return "main";
  }
  if ((section === "side" && position === "top") || section === "top" || position === "top" || position === "side_top") {
    return "top";
  }
  if ((section === "side" && position === "bottom") || section === "bottom" || position === "bottom" || position === "side_bottom") {
    return "bottom";
  }
  return "";
};

exports.getHomeBannerEvents = async () => {
  const pool = await connectDB();

  const result = await pool.request().query(`
    SELECT
      id,
      code,
      title,
      description,
      banner_image,
      start_date,
      end_date,
      status,
      metadata,
      created_at
    FROM SALE_EVENT
    WHERE status = 1
      AND (start_date IS NULL OR start_date <= GETDATE())
      AND (end_date IS NULL OR end_date >= GETDATE())
      AND banner_image IS NOT NULL
      AND LTRIM(RTRIM(CAST(banner_image AS NVARCHAR(500)))) <> ''
    ORDER BY created_at DESC, id DESC
  `);

  return (result.recordset || [])
    .map((event) => {
      const metadata = parseJsonObject(event.metadata);
      return {
        ...event,
        metadata,
        homeBannerSlot: getHomeBannerSlot(metadata),
      };
    })
    .filter((event) => {
      const showOnHome = getMetadataValue(event.metadata, "showOnHome");
      return (
        event.homeBannerSlot &&
        (showOnHome === true || showOnHome === 1 || String(showOnHome).toLowerCase() === "true")
      );
    });
};

exports.getActivePromotionPrograms = async ({ productLimit = 8 } = {}) => {
  const pool = await connectDB();
  const limit = Math.max(1, Math.min(Number(productLimit) || 8, 20));

  const result = await pool.request()
    .input("productLimit", sql.Int, limit)
    .query(`
      SELECT
        E.id,
        E.code,
        E.title,
        E.description,
        E.banner_image,
        E.start_date,
        E.end_date,
        E.status,
        E.metadata,
        E.created_at,
        ProductJson = ISNULL((
          SELECT TOP (@productLimit)
            P.ProductID,
            P.ProductName,
            LOT.Barcode,
            P.Price,
            P.Image,
            ISNULL(BDQ.StockQuantity, 0) AS StockQuantity,
            P.CategoryID,
            P.SubCategoryID,
            C.CategoryName,
            SC.SubCategoryName,
            PS.sale_price,
            PS.start_date,
            PS.end_date,
            PS.status AS sale_status
          FROM PRODUCT_SALE PS
          INNER JOIN PRODUCT P ON CAST(P.ProductID AS NVARCHAR(50)) = CAST(PS.product_id AS NVARCHAR(50))
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
          WHERE PS.SaleEventID = E.id
            AND PS.status = 1
            AND (PS.start_date IS NULL OR PS.start_date <= GETDATE())
            AND (PS.end_date IS NULL OR PS.end_date >= GETDATE())
            AND (P.IsHidden = 0 OR P.IsHidden IS NULL)
            AND (C.IsHidden = 0 OR C.IsHidden IS NULL)
            AND (SC.IsHidden = 0 OR SC.IsHidden IS NULL)
          ORDER BY PS.id ASC
          FOR JSON PATH
        ), '[]')
      FROM SALE_EVENT E
      WHERE E.status = 1
        AND (E.start_date IS NULL OR E.start_date <= GETDATE())
        AND (E.end_date IS NULL OR E.end_date >= GETDATE())
      ORDER BY E.created_at DESC, E.id DESC
    `);

  return (result.recordset || []).map((event) => ({
    id: event.id,
    code: event.code,
    title: event.title,
    description: event.description,
    banner_image: event.banner_image,
    start_date: event.start_date,
    end_date: event.end_date,
    status: event.status,
    metadata: parseJsonObject(event.metadata),
    created_at: event.created_at,
    products: JSON.parse(event.ProductJson || "[]"),
  }));
};

exports.getEventProducts = async (id) => {
  const eventKey = String(id || "").trim();
  if (!eventKey) {
    const error = new Error("Thiếu mã sự kiện.");
    error.statusCode = 400;
    throw error;
  }

  const pool = await connectDB();
  const eventResult = await pool.request()
    .input("eventKey", sql.NVarChar(100), eventKey)
    .query(`
      SELECT TOP 1
        id,
        code,
        title,
        description,
        banner_image,
        start_date,
        end_date,
        status,
        metadata,
        created_at
      FROM SALE_EVENT
      WHERE (code = @eventKey OR CAST(id AS NVARCHAR(100)) = @eventKey)
        AND status = 1
      ORDER BY
        CASE WHEN code = @eventKey THEN 0 ELSE 1 END,
        id DESC
    `);

  const event = eventResult.recordset?.[0] || null;
  if (!event) {
    const error = new Error("Không tìm thấy sự kiện.");
    error.statusCode = 404;
    throw error;
  }

  const eventId = Number(event.id || 0);
  const productResult = await pool.request()
    .input("SaleEventID", sql.Int, eventId)
    .query(`
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
        C.CategoryName,
        SC.SubCategoryName,
        PS.sale_price,
        PS.start_date,
        PS.end_date,
        PS.status AS sale_status
      FROM PRODUCT_SALE PS
      INNER JOIN PRODUCT P ON CAST(P.ProductID AS NVARCHAR(50)) = CAST(PS.product_id AS NVARCHAR(50))
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
      WHERE PS.SaleEventID = @SaleEventID
        AND PS.status = 1
        AND (P.IsHidden = 0 OR P.IsHidden IS NULL)
        AND (C.IsHidden = 0 OR C.IsHidden IS NULL)
        AND (SC.IsHidden = 0 OR SC.IsHidden IS NULL)
      ORDER BY PS.id ASC
    `);

  return {
    event: {
      ...event,
      metadata: parseJsonObject(event.metadata),
    },
    products: productResult.recordset || [],
  };
};
