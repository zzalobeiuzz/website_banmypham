const brandModel = require("../models/brand.model");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { processHtmlWithPrefix } = require("../utils/processHtmlWithPrefix");
const { downloadImage } = require("../utils/imageDownloader");

const BRAND_ICON_DIR = path.join(__dirname, "../../../uploads/assets/icons");
const BRAND_DESCRIPTION_FOLDER = "BrandDescription";

const sanitizeFileBaseName = (value) =>
  String(value || "brand")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "brand";

const ensureBrandIconDir = () => {
  if (!fs.existsSync(BRAND_ICON_DIR)) {
    fs.mkdirSync(BRAND_ICON_DIR, { recursive: true });
  }
};

const saveBrandLogoFromFile = ({ file, idBrand }) => {
  if (!file?.buffer) return null;

  ensureBrandIconDir();

  const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
  const safeExt = /^\.(png|jpg|jpeg|webp|gif|svg|avif)$/.test(ext) ? ext : ".png";
  const filename = `brand_${sanitizeFileBaseName(idBrand)}_${Date.now()}${safeExt}`;
  const savePath = path.join(BRAND_ICON_DIR, filename);

  fs.writeFileSync(savePath, file.buffer);
  return `/uploads/assets/icons/${filename}`;
};

const saveBrandLogoFromUrl = async ({ url, idBrand }) => {
  const raw = String(url || "").trim();
  if (!raw) return null;

  // Nếu đã là đường dẫn nội bộ thì giữ nguyên.
  if (raw.startsWith("/uploads/")) return raw;

  // Chỉ tự tải nếu là URL web.
  if (!/^https?:\/\//i.test(raw)) return raw;

  ensureBrandIconDir();

  const response = await axios.get(raw, { responseType: "arraybuffer", timeout: 15000 });
  const contentType = String(response.headers?.["content-type"] || "").toLowerCase();

  let ext = ".png";
  if (contentType.includes("jpeg")) ext = ".jpg";
  else if (contentType.includes("webp")) ext = ".webp";
  else if (contentType.includes("gif")) ext = ".gif";
  else if (contentType.includes("svg")) ext = ".svg";
  else if (contentType.includes("avif")) ext = ".avif";

  const filename = `brand_${sanitizeFileBaseName(idBrand)}_${Date.now()}${ext}`;
  const savePath = path.join(BRAND_ICON_DIR, filename);

  fs.writeFileSync(savePath, response.data);
  return `/uploads/assets/icons/${filename}`;
};

const saveBase64ImageByMappedSrc = ({ oldSrc, newSrc }) => {
  const relativePath = String(newSrc || "").replace("http://localhost:5000", "");
  const fullPath = path.join(__dirname, "../../../", relativePath);

  if (fs.existsSync(fullPath)) return;

  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const base64Data = String(oldSrc || "").split(",")[1] || "";
  if (!base64Data) return;

  fs.writeFileSync(fullPath, Buffer.from(base64Data, "base64"));
};

const ensureBrandDescriptionSrc = (src) => {
  const raw = String(src || "").trim();
  if (!raw) return raw;

  const fileName = path.basename(raw);
  return `http://localhost:5000/uploads/assets/pictures/${BRAND_DESCRIPTION_FOLDER}/${fileName}`;
};

exports.getAllBrands = async () => {
  const data = await brandModel.getAllBrands();
  return {
    success: true,
    data,
  };
};

exports.createBrand = async (req) => {
  const payload = req?.body || {};
  const idBrand = String(payload?.idBrand || "").trim();
  const Brand = String(payload?.Brand || payload?.name || "").trim();
  let description = payload?.description ? String(payload.description).trim() : "";

  if (!idBrand) {
    throw new Error("idBrand không được để trống.");
  }

  if (!Brand) {
    throw new Error("Tên thương hiệu không được để trống.");
  }

  const totalImageMap = [];
  if (description) {
    const { html, imageMap } = processHtmlWithPrefix(
      description,
      "branddescription",
      BRAND_DESCRIPTION_FOLDER,
    );
    description = html;

    imageMap.forEach((item) => {
      const forcedSrc = ensureBrandDescriptionSrc(item.newSrc);

      if (forcedSrc && forcedSrc !== item.newSrc) {
        description = description.replaceAll(item.newSrc, forcedSrc);
      }

      totalImageMap.push({
        ...item,
        newSrc: forcedSrc,
      });
    });
  }

  let resolvedLogoUrl = null;

  if (req?.file) {
    resolvedLogoUrl = saveBrandLogoFromFile({ file: req.file, idBrand });
  } else if (payload?.logo_url) {
    resolvedLogoUrl = await saveBrandLogoFromUrl({ url: payload.logo_url, idBrand });
  }

  const data = await brandModel.createBrand({
    idBrand,
    Brand,
    description,
    status: payload?.status,
    logo_url: resolvedLogoUrl,
  });

  if (totalImageMap.length > 0) {
    for (const { oldSrc, newSrc, isBase64 } of totalImageMap) {
      try {
        if (isBase64) {
          saveBase64ImageByMappedSrc({ oldSrc, newSrc });
        } else {
          await downloadImage(oldSrc, newSrc);
        }
      } catch (err) {
        console.error(`❌ Không thể lưu ảnh mô tả brand ${oldSrc}:`, err.message);
      }
    }
  }

  return {
    success: true,
    message: "Tạo thương hiệu thành công.",
    data,
  };
};