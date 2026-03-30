const batchModel = require("../models/batch.model");

exports.getAllBatches = async () => {
  try {
    await batchModel.syncExpiredBatchDetailsStatus();

    const batches = await batchModel.findAllBatches();
    return {
      success: true,
      data: batches,
    };
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách lô hàng:", error);
    return {
      success: false,
      message: "Không thể tải danh sách lô hàng",
    };
  }
};

exports.createBatch = async (batchId, note = "") => {
  try {
    const batchIdTrimmed = String(batchId || "").trim();

    if (!batchIdTrimmed) {
      return {
        success: false,
        message: "Mã lô hàng không được để trống",
      };
    }

    // Get all batches to check if it exists
    const allBatches = await batchModel.findAllBatches();
    if (allBatches.some((b) => String(b?.ID || "").trim() === batchIdTrimmed)) {
      return {
        success: false,
        message: `Mã lô "${batchIdTrimmed}" đã tồn tại`,
      };
    }

    const newBatch = await batchModel.createBatch(batchIdTrimmed, note);

    return {
      success: true,
      data: newBatch,
      message: `Lô "${batchIdTrimmed}" đã được tạo`,
    };
  } catch (error) {
    console.error("❌ Lỗi tạo lô hàng:", error);
    return {
      success: false,
      message: "Không thể tạo lô hàng mới",
    };
  }
};

exports.getProductsByBatchId = async (batchId) => {
  try {
    const batchIdTrimmed = String(batchId || "").trim();
    if (!batchIdTrimmed) {
      return {
        success: false,
        message: "Thiếu mã lô hàng",
      };
    }

    const rows = await batchModel.findProductsByBatchId(batchIdTrimmed);
    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    console.error("❌ Lỗi lấy sản phẩm theo mã lô:", error);
    return {
      success: false,
      message: "Không thể tải danh sách sản phẩm của lô hàng",
    };
  }
};

exports.updateBatch = async ({ oldBatchId, newBatchId, note = "" }) => {
  try {
    const oldId = String(oldBatchId || "").trim();
    const nextId = String(newBatchId || "").trim();

    if (!oldId || !nextId) {
      return {
        success: false,
        message: "Thiếu mã lô hàng",
      };
    }

    const updated = await batchModel.updateBatch({
      oldBatchId: oldId,
      newBatchId: nextId,
      note,
    });

    if (!updated) {
      return {
        success: false,
        message: "Không tìm thấy lô hàng để cập nhật",
      };
    }

    if (updated.duplicated) {
      return {
        success: false,
        message: `Mã lô "${nextId}" đã tồn tại`,
      };
    }

    return {
      success: true,
      data: updated,
      message: "Cập nhật lô hàng thành công",
    };
  } catch (error) {
    console.error("❌ Lỗi cập nhật lô hàng:", error);
    return {
      success: false,
      message: "Không thể cập nhật lô hàng",
    };
  }
};

exports.deleteBatch = async (batchId) => {
  try {
    const batchIdTrimmed = String(batchId || "").trim();
    if (!batchIdTrimmed) {
      return {
        success: false,
        message: "Thiếu mã lô hàng",
      };
    }

    const totalProducts = await batchModel.countProductsByBatchId(batchIdTrimmed);
    if (totalProducts > 0) {
      return {
        success: false,
        message: "Không thể xóa lô đã có sản phẩm. Vui lòng xử lý sản phẩm trước.",
      };
    }

    await batchModel.deleteBatch(batchIdTrimmed);

    return {
      success: true,
      message: "Xóa lô hàng thành công",
    };
  } catch (error) {
    console.error("❌ Lỗi xóa lô hàng:", error);
    return {
      success: false,
      message: "Không thể xóa lô hàng",
    };
  }
};

exports.updateProductInBatch = async ({
  batchId,
  productId,
  oldBarcode,
  newBarcode,
  quantity,
  isActive,
}) => {
  try {
    const batchIdTrimmed = String(batchId || "").trim();
    const productIdTrimmed = String(productId || "").trim();
    const oldBarcodeTrimmed = String(oldBarcode || "").trim();
    const newBarcodeTrimmed = String(newBarcode || "").trim();
    const normalizedQty = Number(quantity || 0);

    if (!batchIdTrimmed || !productIdTrimmed || !oldBarcodeTrimmed || !newBarcodeTrimmed) {
      return {
        success: false,
        message: "Thiếu dữ liệu cập nhật sản phẩm trong lô",
      };
    }

    if (Number.isNaN(normalizedQty) || normalizedQty < 0) {
      return {
        success: false,
        message: "Số lượng không hợp lệ",
      };
    }

    const updatedRows = await batchModel.updateProductInBatch({
      batchId: batchIdTrimmed,
      productId: productIdTrimmed,
      oldBarcode: oldBarcodeTrimmed,
      newBarcode: newBarcodeTrimmed,
      quantity: normalizedQty,
      isActive: Number(isActive || 0) === 1 ? 1 : 0,
    });

    if (updatedRows <= 0) {
      return {
        success: false,
        message: "Không tìm thấy dòng sản phẩm trong lô để cập nhật",
      };
    }

    return {
      success: true,
      message: "Cập nhật sản phẩm trong lô thành công",
    };
  } catch (error) {
    console.error("❌ Lỗi updateProductInBatch:", error);
    return {
      success: false,
      message: "Không thể cập nhật sản phẩm trong lô",
    };
  }
};
