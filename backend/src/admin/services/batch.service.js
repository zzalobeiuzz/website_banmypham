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
