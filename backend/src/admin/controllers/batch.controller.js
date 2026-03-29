const batchService = require("../services/batch.service");

exports.getAllBatches = async (req, res) => {
  try {
    const result = await batchService.getAllBatches();

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi getAllBatches:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lô hàng",
    });
  }
};
