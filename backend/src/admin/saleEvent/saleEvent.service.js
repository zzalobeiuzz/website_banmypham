const fs = require("fs");
const path = require("path");
const { connectDB, sql } = require("../../config/connect");

const SALE_EVENT_IMAGE_DIR = path.join(
  __dirname,
  "../../../uploads/assets/pictures/SaleEvents",
);

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
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"].includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return fallback;
};

const saveBannerFromFile = ({ file, code }) => {
  if (!file?.buffer) return "";

  ensureSaleEventImageDir();

  const rawExt = path.extname(file.originalname || "") || (file.mimetype ? `.${file.mimetype.split("/")[1]}` : ".jpg");
  const ext = normalizeExt(rawExt);
  const safeCode = sanitizeBaseName(code || file.originalname || "sale_event");
  const fileName = `sale_event_${safeCode}_${Date.now()}${ext}`;
  const targetPath = path.join(SALE_EVENT_IMAGE_DIR, fileName);

  fs.writeFileSync(targetPath, file.buffer);
  return `/uploads/assets/pictures/SaleEvents/${fileName}`;
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

exports.createSaleEvent = async ({ body, file }) => {
  const pool = await connectDB();

  const code = String(body?.code || "").trim();
  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const startDate = parseDateOrNull(body?.start_date || body?.startDate);
  const endDate = parseDateOrNull(body?.end_date || body?.endDate);
  const status = parseIntSafe(body?.status, 1) === 1 ? 1 : 0;
  const totalProductsCount = parseIntSafe(body?.total_products_count || body?.totalProductsCount, 0);
  const metadata = String(body?.metadata || "").trim() || null;

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

  const bannerImage = file ? saveBannerFromFile({ file, code: code || title }) : String(body?.banner_image || body?.bannerImage || "").trim() || null;

  const request = pool.request();
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

  return result.recordset?.[0] || null;
};