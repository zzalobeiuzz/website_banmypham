const {
  findSaleProducts,
  findHotProducts,
  findFeaturedBrands,
  findCategories,
  findAllProducts,
  findProductDetailById,
  findBatchDetailsByProductId,
  syncExpiredBatchDetailsStatus,
  findBrandDetailWithProducts,
} = require("../models/product.model");
const { calculateDiscountPercent, calculateTimeLeft } = require("../utils/productUtils");

const BATCH_SYNC_INTERVAL_MS = Number(process.env.BATCH_SYNC_INTERVAL_MS || 10 * 60 * 1000);
let lastBatchSyncAt = 0;
let isBatchSyncRunning = false;

const triggerBatchSyncInBackground = () => {
  const now = Date.now();
  if (isBatchSyncRunning) return;
  if (now - lastBatchSyncAt < BATCH_SYNC_INTERVAL_MS) return;

  isBatchSyncRunning = true;
  lastBatchSyncAt = now;

  syncExpiredBatchDetailsStatus()
    .catch((error) => {
      console.error("❌ Lỗi đồng bộ lô hết hạn (background):", error?.message || error);
    })
    .finally(() => {
      isBatchSyncRunning = false;
    });
};

// ================================ LẤY DANH SÁCH SẢN PHẨM SALE ==============================
exports.getSaleProducts = async () => {
  const data = await findSaleProducts();
  return data.map(p => ({
    ...p,
    discountPercent: calculateDiscountPercent(p),
    discountTimeLeft: calculateTimeLeft(p.end_date),
  }));
};

// ================================ LẤY DANH SÁCH SẢN PHẨM HOT ==============================
exports.getHotProducts = async () => {
  const data = await findHotProducts();
  return data.map(p => ({
    ...p,
    discountPercent: calculateDiscountPercent(p),
  }));
};

// ================================ LẤY THƯƠNG HIỆU NỔI BẬT ==============================
exports.getFeaturedBrands = async () => {
  const data = await findFeaturedBrands();
  return data.map((brand) => ({
    idBrand: brand.idBrand,
    brandName: brand.Brand,
    logoUrl: brand.logo_url,
    previewImage: brand.preview_image,
  }));
};

// ================================ LẤY TẤT CẢ CATEGORY ==============================
exports.getAllCategories = async () => {
  try {
    
    const categories = await findCategories();
    return categories;
  } catch (error) {
    console.error("❌ Lỗi khi lấy categories:", error);
    throw error;
  }
};
// ================================ LẤY TẤT CẢ SẢN PHẨM ==============================
exports.getAllProducts = async () => {
  try {
    triggerBatchSyncInBackground();

    const data = await findAllProducts();

    // Nếu sản phẩm có trường giảm giá, thêm % giảm và thời gian còn lại (nếu cần)
    return data.map(p => ({
      ...p,
      discountPercent: p.sale_price ? calculateDiscountPercent(p) : 0,
      discountTimeLeft: p.end_date ? calculateTimeLeft(p.end_date) : null,
    }));
  } catch (error) {
    console.error("❌ Lỗi khi lấy tất cả sản phẩm:", error);
    throw error;
  }
};

// ================================ LẤY CHI TIẾT 1 MẢNG SẢN PHẨM ==============================
exports.getProductDetailById = async (input) => {
  try {
    if (!input) {
      return {
        success: false,
        message: "Thiếu mã sản phẩm.",
      };
    }

    // 👉 luôn convert về array
    const ids = Array.isArray(input) ? input : [input];

    triggerBatchSyncInBackground();

    // 🔥 lấy nhiều sản phẩm
    const products = await findProductDetailById(ids);

    if (!products || products.length === 0) {
      return {
        success: false,
        message: "Không tìm thấy sản phẩm.",
      };
    }

     // 🔥 ✅ LẤY BATCH 1 LẦN DUY NHẤT
    const batchMap = await findBatchDetailsByProductId(ids);

    // 🔥 merge lại
    const result = products.map((product) => ({
      ...product,
      batchDetails: batchMap[product.ProductID] || [],
    }));

    // 👉 nếu là 1 id → trả object
    if (!Array.isArray(input)) {
      return {
        success: true,
        data: result[0],
      };
    }

    // 👉 nếu là nhiều id → trả array
    return {
      success: true,
      data: result,
    };

  } catch (error) {
    console.error("❌ Lỗi getProductDetailById:", error);
    throw error;
  }
};

// ================================ LẤY TRANG CHI TIẾT THƯƠNG HIỆU ==============================
exports.getBrandDetailPage = async (idBrand) => {
  const result = await findBrandDetailWithProducts(idBrand);

  if (!result?.brand) {
    return {
      success: false,
      message: "Không tìm thấy thương hiệu.",
      data: null,
    };
  }

  const products = (result.products || []).map((product) => ({
    ...product,
    discountPercent: product.sale_price ? calculateDiscountPercent(product) : 0,
    discountTimeLeft: product.end_date ? calculateTimeLeft(product.end_date) : null,
  }));

  return {
    success: true,
    data: {
      brand: result.brand,
      products,
    },
  };
};