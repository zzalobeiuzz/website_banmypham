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

exports.createBatch = async (req, res) => {
  try {
    const { batchId, note } = req.body;

    const result = await batchService.createBatch(batchId, note);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("❌ Lỗi createBatch:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo lô hàng",
    });
  }
};

exports.getProductsByBatchId = async (req, res) => {
  try {
    const { batchId } = req.params;
    const result = await batchService.getProductsByBatchId(batchId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi getProductsByBatchId:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết lô hàng",
    });
  }
};

exports.updateBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { newBatchId, note } = req.body;

    const result = await batchService.updateBatch({
      oldBatchId: batchId,
      newBatchId,
      note,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi updateBatch:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật lô hàng",
    });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const result = await batchService.deleteBatch(batchId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi deleteBatch:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa lô hàng",
    });
  }
};

exports.updateProductInBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const {
      productId,
      oldBarcode,
      newBarcode,
      quantity,
      isActive,
    } = req.body;

    const result = await batchService.updateProductInBatch({
      batchId,
      productId,
      oldBarcode,
      newBarcode,
      quantity,
      isActive,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi updateProductInBatch:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật sản phẩm trong lô",
    });
  }
};
