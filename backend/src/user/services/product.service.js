const {
  findSaleProducts,
  findHotProducts,
  findCategories,
  findAllProducts,
  findProductDetailById,
  findBatchDetailsByProductId,
  syncExpiredBatchDetailsStatus,
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

// ================================ LẤY CHI TIẾT 1 SẢN PHẨM ==============================
exports.getProductDetailById = async (productId) => {
  try {
    if (!productId) {
      return {
        success: false,
        message: "Thiếu mã sản phẩm.",
      };
    }

    triggerBatchSyncInBackground();

    const product = await findProductDetailById(productId);
    if (!product) {
      return {
        success: false,
        message: "Không tìm thấy sản phẩm.",
      };
    }

    const batchDetails = await findBatchDetailsByProductId(productId);

    return {
      success: true,
      data: {
        ...product,
        batchDetails,
      },
    };
  } catch (error) {
    console.error("❌ Lỗi getProductDetailById:", error);
    throw error;
  }
};