const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { connectDB, sql } = require("../../config/connect");

const SALE_EVENT_IMAGE_DIR = path.join(
  __dirname,
  "../../../uploads/assets/pictures/BannerImage",
);

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"];
const MIME_TO_EXTENSION = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const ensureSaleEventImageDir = () => {
  if (!fs.existsSync(SALE_EVENT_IMAGE_DIR)) {
    fs.mkdirSync(SALE_EVENT_IMAGE_DIR, { recursive: true });
  }
};

const sanitizeBaseName = (value) =>
  String(value || "sale_event")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "sale_event";

const normalizeExt = (inputExt, fallback = ".jpg") => {
  const ext = String(inputExt || "").toLowerCase();
  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return fallback;
};

const getExtFromUrl = (imageUrl) => {
  try {
    return path.extname(new URL(imageUrl).pathname);
  } catch {
    return "";
  }
};

const getUniqueBannerFileName = ({ code, sourceName, ext }) => {
  const safeCode = sanitizeBaseName(code || sourceName || "sale_event");
  return `sale_event_${safeCode}_${Date.now()}${normalizeExt(ext)}`;
};

const normalizeBannerFileName = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    return path.basename(new URL(raw).pathname) || null;
  } catch {
    return path.basename(raw.replace(/\\/g, "/")) || null;
  }
};

const writeBannerFile = ({ buffer, fileName }) => {
  ensureSaleEventImageDir();
  const targetPath = path.join(SALE_EVENT_IMAGE_DIR, fileName);
  fs.writeFileSync(targetPath, buffer);
  return fileName;
};

const saveBannerFromFile = ({ file, code }) => {
  if (!file?.buffer) return "";

  const mimetype = String(file.mimetype || "").toLowerCase();
  if (mimetype && !MIME_TO_EXTENSION[mimetype]) {
    const error = new Error("Ảnh banner không hợp lệ. Chỉ nhận JPG, PNG, WEBP, GIF, AVIF.");
    error.statusCode = 400;
    throw error;
  }

  const rawExt = path.extname(file.originalname || "") || MIME_TO_EXTENSION[mimetype] || ".jpg";
  const fileName = getUniqueBannerFileName({
    code,
    sourceName: file.originalname,
    ext: rawExt,
  });

  return writeBannerFile({ buffer: file.buffer, fileName });
};

const downloadBannerFromUrl = async ({ imageUrl, code }) => {
  const rawUrl = String(imageUrl || "").trim();
  if (!rawUrl) return "";

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    const error = new Error("URL ảnh banner không hợp lệ.");
    error.statusCode = 400;
    throw error;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    const error = new Error("URL ảnh banner chỉ được dùng http hoặc https.");
    error.statusCode = 400;
    throw error;
  }

  const response = await axios.get(rawUrl, {
    responseType: "arraybuffer",
    timeout: 15000,
    maxContentLength: 10 * 1024 * 1024,
    headers: {
      "User-Agent": "QLMP-Admin/1.0",
    },
  });

  const contentType = String(response.headers?.["content-type"] || "").split(";")[0].toLowerCase();
  if (!MIME_TO_EXTENSION[contentType]) {
    const error = new Error("URL không trả về ảnh hợp lệ.");
    error.statusCode = 400;
    throw error;
  }

  const buffer = Buffer.from(response.data);
  const ext = normalizeExt(getExtFromUrl(rawUrl), MIME_TO_EXTENSION[contentType]);
  const fileName = getUniqueBannerFileName({
    code,
    sourceName: path.basename(parsedUrl.pathname),
    ext,
  });

  return writeBannerFile({ buffer, fileName });
};

const parseIntSafe = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseSaleProducts = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeSaleProducts = (value) => {
  const rows = parseSaleProducts(value);
  const seen = new Set();

  return rows.reduce((acc, row) => {
    const productId = String(row?.product_id || row?.productId || row?.ProductID || "").trim();
    const salePrice = Number(row?.sale_price || row?.salePrice || 0);
    if (!productId || seen.has(productId)) return acc;

    seen.add(productId);
    acc.push({
      productId,
      salePrice,
    });
    return acc;
  }, []);
};

const validateSaleProducts = (saleProducts) => {
  const invalidRow = saleProducts.find((row) => !row.productId || !Number.isFinite(row.salePrice) || row.salePrice <= 0);
  if (invalidRow) {
    const error = new Error("Vui lòng chọn sản phẩm sale và nhập giá sale lớn hơn 0.");
    error.statusCode = 400;
    throw error;
  }
};

const assertSalePriceNotHigherThanOriginal = async ({ transaction, saleProducts }) => {
  if (!saleProducts.length) return;

  const request = new sql.Request(transaction);
  const productParams = saleProducts.map((product, index) => {
    const key = `price_product_id_${index}`;
    request.input(key, sql.NVarChar(50), product.productId);
    return `@${key}`;
  });

  const result = await request.query(`
    SELECT
      CAST(ProductID AS NVARCHAR(50)) AS ProductID,
      CAST(Price AS DECIMAL(18, 2)) AS Price
    FROM PRODUCT
    WHERE CAST(ProductID AS NVARCHAR(50)) IN (${productParams.join(", ")})
  `);

  const priceMap = new Map(
    (result.recordset || []).map((row) => [String(row.ProductID || "").trim(), Number(row.Price || 0)]),
  );

  const missingProduct = saleProducts.find((product) => !priceMap.has(product.productId));
  if (missingProduct) {
    const error = new Error(`Không tìm thấy sản phẩm ${missingProduct.productId}.`);
    error.statusCode = 400;
    throw error;
  }

  const invalidProduct = saleProducts.find((product) => product.salePrice >= Number(priceMap.get(product.productId) || 0));
  if (invalidProduct) {
    const error = new Error(`Giá sale của sản phẩm ${invalidProduct.productId} phải nhỏ hơn giá gốc.`);
    error.statusCode = 400;
    throw error;
  }
};

const assertNoOverlappingProductSales = async ({ transaction, saleProducts, startDate, endDate, excludeSaleEventId = null }) => {
  if (!saleProducts.length) return;

  const request = new sql.Request(transaction);
  const productParams = saleProducts.map((product, index) => {
    const key = `product_id_${index}`;
    request.input(key, sql.NVarChar(50), product.productId);
    return `@${key}`;
  });

  request.input("start_date", sql.DateTime, startDate);
  request.input("end_date", sql.DateTime, endDate);
  request.input("exclude_sale_event_id", sql.Int, excludeSaleEventId ? Number(excludeSaleEventId) : null);

  const result = await request.query(`
    SELECT TOP 5
      product_id,
      sale_price,
      start_date,
      end_date,
      ProgramName
    FROM PRODUCT_SALE
    WHERE CAST(product_id AS NVARCHAR(50)) IN (${productParams.join(", ")})
      AND status = 1
      AND (@exclude_sale_event_id IS NULL OR ISNULL(SaleEventID, 0) <> @exclude_sale_event_id)
      AND ISNULL(end_date, CONVERT(datetime, '9999-12-31')) >= ISNULL(@start_date, CONVERT(datetime, '1900-01-01'))
      AND ISNULL(start_date, CONVERT(datetime, '1900-01-01')) <= ISNULL(@end_date, CONVERT(datetime, '9999-12-31'))
    ORDER BY created_at DESC, id DESC
  `);

  const conflictedRows = result.recordset || [];
  if (conflictedRows.length > 0) {
    const productList = conflictedRows.map((row) => row.product_id).join(", ");
    const error = new Error(`Sản phẩm ${productList} đang có chương trình sale trong khoảng thời gian này.`);
    error.statusCode = 409;
    throw error;
  }
};

exports.getUnavailableProductSales = async ({ startDate: rawStartDate, endDate: rawEndDate, excludeSaleEventId = null }) => {
  const pool = await connectDB();
  const startDate = parseDateOrNull(rawStartDate);
  const endDate = parseDateOrNull(rawEndDate);

  if (startDate && endDate && startDate > endDate) {
    const error = new Error("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.");
    error.statusCode = 400;
    throw error;
  }

  const request = pool.request();
  request.input("start_date", sql.DateTime, startDate);
  request.input("end_date", sql.DateTime, endDate);
  request.input("exclude_sale_event_id", sql.Int, excludeSaleEventId ? Number(excludeSaleEventId) : null);

  const result = await request.query(`
    SELECT
      product_id,
      sale_price,
      start_date,
      end_date,
      ProgramName,
      SaleEventID
    FROM PRODUCT_SALE
    WHERE status = 1
      AND (@exclude_sale_event_id IS NULL OR ISNULL(SaleEventID, 0) <> @exclude_sale_event_id)
      AND ISNULL(end_date, CONVERT(datetime, '9999-12-31')) >= ISNULL(@start_date, GETDATE())
      AND ISNULL(start_date, CONVERT(datetime, '1900-01-01')) <= ISNULL(@end_date, CONVERT(datetime, '9999-12-31'))
    ORDER BY created_at DESC, id DESC
  `);

  const rows = result.recordset || [];
  const uniqueMap = new Map();
  rows.forEach((row) => {
    const productId = String(row.product_id || "").trim();
    if (productId && !uniqueMap.has(productId)) {
      uniqueMap.set(productId, row);
    }
  });

  return Array.from(uniqueMap.values());
};

exports.getAllSaleEvents = async () => {
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
      total_products_count,
      metadata,
      created_at
    FROM SALE_EVENT
    ORDER BY created_at DESC, id DESC
  `);

  return result.recordset || [];
};

exports.getSaleEventDetail = async (id) => {
  const saleEventId = Number(id || 0);
  if (!saleEventId) {
    const error = new Error("Thiếu mã sự kiện.");
    error.statusCode = 400;
    throw error;
  }

  const pool = await connectDB();
  const eventResult = await pool.request()
    .input("id", sql.Int, saleEventId)
    .query(`
      SELECT
        id,
        code,
        title,
        description,
        banner_image,
        start_date,
        end_date,
        status,
        total_products_count,
        metadata,
        created_at
      FROM SALE_EVENT
      WHERE id = @id
    `);

  const saleEvent = eventResult.recordset?.[0] || null;
  if (!saleEvent) {
    const error = new Error("Không tìm thấy sự kiện.");
    error.statusCode = 404;
    throw error;
  }

  const saleProductsResult = await pool.request()
    .input("SaleEventID", sql.Int, saleEventId)
    .query(`
      SELECT
        PS.id,
        PS.product_id,
        PS.sale_price,
        PS.start_date,
        PS.end_date,
        PS.status,
        PS.SaleEventID,
        PS.ProgramName,
        P.ProductName,
        P.Price,
        P.Image
      FROM PRODUCT_SALE PS
      LEFT JOIN PRODUCT P ON CAST(P.ProductID AS NVARCHAR(50)) = CAST(PS.product_id AS NVARCHAR(50))
      WHERE PS.SaleEventID = @SaleEventID
      ORDER BY PS.id ASC
    `);

  return {
    ...saleEvent,
    sale_products: saleProductsResult.recordset || [],
  };
};

exports.createSaleEvent = async ({ body, file }) => {
  const pool = await connectDB();

  const code = String(body?.code || "").trim();
  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const startDate = parseDateOrNull(body?.start_date || body?.startDate);
  const endDate = parseDateOrNull(body?.end_date || body?.endDate);
  const status = parseIntSafe(body?.status, 1) === 1 ? 1 : 0;
  const metadata = String(body?.metadata || "").trim() || null;
  const bannerImageUrl = String(body?.bannerImageUrl || body?.banner_image_url || "").trim();
  const saleProducts = normalizeSaleProducts(body?.saleProducts || body?.sale_products);
  const totalProductsCount = saleProducts.length || parseIntSafe(body?.total_products_count || body?.totalProductsCount, 0);

  if (!title) {
    const error = new Error("Tiêu đề sự kiện không được để trống.");
    error.statusCode = 400;
    throw error;
  }

  if (startDate && endDate && startDate > endDate) {
    const error = new Error("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.");
    error.statusCode = 400;
    throw error;
  }

  validateSaleProducts(saleProducts);

  let bannerImage = null;
  if (file) {
    bannerImage = saveBannerFromFile({ file, code: code || title });
  } else if (bannerImageUrl) {
    bannerImage = await downloadBannerFromUrl({ imageUrl: bannerImageUrl, code: code || title });
  } else {
    bannerImage = normalizeBannerFileName(body?.banner_image || body?.bannerImage);
  }

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    await assertSalePriceNotHigherThanOriginal({
      transaction,
      saleProducts,
    });

    await assertNoOverlappingProductSales({
      transaction,
      saleProducts,
      startDate,
      endDate,
    });

    const request = new sql.Request(transaction);
    request.input("code", sql.NVarChar(100), code || null);
    request.input("title", sql.NVarChar(255), title);
    request.input("description", sql.NVarChar(sql.MAX), description || null);
    request.input("banner_image", sql.NVarChar(500), bannerImage);
    request.input("start_date", sql.DateTime, startDate);
    request.input("end_date", sql.DateTime, endDate);
    request.input("status", sql.TinyInt, status);
    request.input("total_products_count", sql.Int, totalProductsCount);
    request.input("metadata", sql.NVarChar(sql.MAX), metadata);

    const result = await request.query(`
      INSERT INTO SALE_EVENT
      (
        code,
        title,
        description,
        banner_image,
        start_date,
        end_date,
        status,
        total_products_count,
        metadata,
        created_at
      )
      OUTPUT INSERTED.*
      VALUES
      (
        @code,
        @title,
        @description,
        @banner_image,
        @start_date,
        @end_date,
        @status,
        @total_products_count,
        @metadata,
        GETDATE()
      )
    `);

    const saleEvent = result.recordset?.[0] || null;
    const saleEventId = Number(saleEvent?.id || 0);

    for (const product of saleProducts) {
      const productSaleRequest = new sql.Request(transaction);
      productSaleRequest.input("product_id", sql.NVarChar(50), product.productId);
      productSaleRequest.input("sale_price", sql.Decimal(10, 2), product.salePrice);
      productSaleRequest.input("start_date", sql.DateTime, startDate);
      productSaleRequest.input("end_date", sql.DateTime, endDate);
      productSaleRequest.input("status", sql.TinyInt, status);
      productSaleRequest.input("SaleEventID", sql.Int, saleEventId || null);
      productSaleRequest.input("ProgramName", sql.NVarChar(255), title);

      await productSaleRequest.query(`
        INSERT INTO PRODUCT_SALE
        (
          product_id,
          sale_price,
          start_date,
          end_date,
          status,
          SaleEventID,
          ProgramName
        )
        VALUES
        (
          @product_id,
          @sale_price,
          @start_date,
          @end_date,
          @status,
          @SaleEventID,
          @ProgramName
        )
      `);
    }

    await transaction.commit();
    return {
      ...saleEvent,
      sale_products_count: saleProducts.length,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.updateSaleEvent = async ({ id, body, file }) => {
  const pool = await connectDB();
  const saleEventId = Number(id || 0);

  if (!saleEventId) {
    const error = new Error("Thiếu mã sự kiện.");
    error.statusCode = 400;
    throw error;
  }

  const currentEvent = await exports.getSaleEventDetail(saleEventId);
  const code = String(body?.code || "").trim();
  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const startDate = parseDateOrNull(body?.start_date || body?.startDate);
  const endDate = parseDateOrNull(body?.end_date || body?.endDate);
  const status = parseIntSafe(body?.status, 1) === 1 ? 1 : 0;
  const metadata = String(body?.metadata || "").trim() || null;
  const bannerImageUrl = String(body?.bannerImageUrl || body?.banner_image_url || "").trim();
  const saleProducts = normalizeSaleProducts(body?.saleProducts || body?.sale_products);
  const totalProductsCount = saleProducts.length || parseIntSafe(body?.total_products_count || body?.totalProductsCount, 0);

  if (!title) {
    const error = new Error("Tiêu đề sự kiện không được để trống.");
    error.statusCode = 400;
    throw error;
  }

  if (startDate && endDate && startDate > endDate) {
    const error = new Error("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.");
    error.statusCode = 400;
    throw error;
  }

  validateSaleProducts(saleProducts);

  let bannerImage = currentEvent.banner_image || null;
  if (file) {
    bannerImage = saveBannerFromFile({ file, code: code || title });
  } else if (bannerImageUrl) {
    bannerImage = await downloadBannerFromUrl({ imageUrl: bannerImageUrl, code: code || title });
  } else if (body?.banner_image || body?.bannerImage) {
    bannerImage = normalizeBannerFileName(body?.banner_image || body?.bannerImage);
  }

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    await assertSalePriceNotHigherThanOriginal({
      transaction,
      saleProducts,
    });

    await assertNoOverlappingProductSales({
      transaction,
      saleProducts,
      startDate,
      endDate,
      excludeSaleEventId: saleEventId,
    });

    const updateRequest = new sql.Request(transaction);
    updateRequest.input("id", sql.Int, saleEventId);
    updateRequest.input("code", sql.NVarChar(100), code || null);
    updateRequest.input("title", sql.NVarChar(255), title);
    updateRequest.input("description", sql.NVarChar(sql.MAX), description || null);
    updateRequest.input("banner_image", sql.NVarChar(500), bannerImage);
    updateRequest.input("start_date", sql.DateTime, startDate);
    updateRequest.input("end_date", sql.DateTime, endDate);
    updateRequest.input("status", sql.TinyInt, status);
    updateRequest.input("total_products_count", sql.Int, totalProductsCount);
    updateRequest.input("metadata", sql.NVarChar(sql.MAX), metadata);

    const result = await updateRequest.query(`
      UPDATE SALE_EVENT
      SET
        code = @code,
        title = @title,
        description = @description,
        banner_image = @banner_image,
        start_date = @start_date,
        end_date = @end_date,
        status = @status,
        total_products_count = @total_products_count,
        metadata = @metadata
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    const deleteRequest = new sql.Request(transaction);
    deleteRequest.input("SaleEventID", sql.Int, saleEventId);
    await deleteRequest.query(`
      DELETE FROM PRODUCT_SALE
      WHERE SaleEventID = @SaleEventID
    `);

    for (const product of saleProducts) {
      const productSaleRequest = new sql.Request(transaction);
      productSaleRequest.input("product_id", sql.NVarChar(50), product.productId);
      productSaleRequest.input("sale_price", sql.Decimal(10, 2), product.salePrice);
      productSaleRequest.input("start_date", sql.DateTime, startDate);
      productSaleRequest.input("end_date", sql.DateTime, endDate);
      productSaleRequest.input("status", sql.TinyInt, status);
      productSaleRequest.input("SaleEventID", sql.Int, saleEventId);
      productSaleRequest.input("ProgramName", sql.NVarChar(255), title);

      await productSaleRequest.query(`
        INSERT INTO PRODUCT_SALE
        (
          product_id,
          sale_price,
          start_date,
          end_date,
          status,
          SaleEventID,
          ProgramName
        )
        VALUES
        (
          @product_id,
          @sale_price,
          @start_date,
          @end_date,
          @status,
          @SaleEventID,
          @ProgramName
        )
      `);
    }

    await transaction.commit();
    return {
      ...(result.recordset?.[0] || {}),
      sale_products_count: saleProducts.length,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.deleteSaleEvent = async (id) => {
  const pool = await connectDB();
  const saleEventId = Number(id || 0);

  if (!saleEventId) {
    const error = new Error("Thiếu mã sự kiện.");
    error.statusCode = 400;
    throw error;
  }

  const existsResult = await pool.request()
    .input("id", sql.Int, saleEventId)
    .query(`
      SELECT id
      FROM SALE_EVENT
      WHERE id = @id
    `);

  if (!existsResult.recordset?.[0]) {
    const error = new Error("Không tìm thấy sự kiện giảm giá.");
    error.statusCode = 404;
    throw error;
  }

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const deleteProductsRequest = new sql.Request(transaction);
    deleteProductsRequest.input("SaleEventID", sql.Int, saleEventId);
    await deleteProductsRequest.query(`
      DELETE FROM PRODUCT_SALE
      WHERE SaleEventID = @SaleEventID
    `);

    const deleteEventRequest = new sql.Request(transaction);
    deleteEventRequest.input("id", sql.Int, saleEventId);
    await deleteEventRequest.query(`
      DELETE FROM SALE_EVENT
      WHERE id = @id
    `);

    await transaction.commit();
    return { id: saleEventId };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
