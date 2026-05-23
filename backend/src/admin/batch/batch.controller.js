const {
  getAllBatches: getAllBatchesService,
  createBatch: createBatchService,
  getProductsByBatchId: getProductsByBatchIdService,
  updateBatch: updateBatchService,
  deleteBatch: deleteBatchService,
  updateProductInBatch: updateProductInBatchService,
  addProductToBatch: addProductToBatchService,
} = require("./batch.service");

async function getAllBatches(req, res) {
  try {
    const result = await getAllBatchesService();

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
}

async function createBatch(req, res) {
  try {
    const { batchId, note } = req.body;

    const result = await createBatchService(batchId, note);

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
}

async function getProductsByBatchId(req, res) {
  try {
    const { batchId } = req.params;
    const result = await getProductsByBatchIdService(batchId);
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
}

async function updateBatch(req, res) {
  try {
    const { batchId } = req.params;
    const { newBatchId, note } = req.body;

    const result = await updateBatchService({
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
}

async function deleteBatch(req, res) {
  try {
    const { batchId } = req.params;
    const result = await deleteBatchService(batchId);

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
}

async function updateProductInBatch(req, res) {
  try {
    console.log("Received updateProductInBatch request with params and body:", req.params, req.body);
    const { batchId } = req.params;
    const {
      productId,
      oldBarcode,
      newBarcode,
      quantity,
      isActive,
      expiryDate,
    } = req.body;

    const result = await updateProductInBatchService({
      batchId,
      productId,
      oldBarcode,
      newBarcode,
      quantity,
      isActive,
      expiryDate,
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
}

async function addProductToBatch(req, res) {
  console.log("------------Đang xử lý thêm sản phẩm vào lô:", req.params, req.body);
  try {
    const { batchId } = req.params;
    const {
      productId,
      barcode,
      quantity,
      isActive,
      expiryDate,
    } = req.body;

    const result = await addProductToBatchService({
      batchId,
      productId,
      barcode,
      quantity,
      isActive,
      expiryDate,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("❌ Lỗi addProductToBatch:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm sản phẩm vào lô",
    });
  }
}

module.exports = {
  getAllBatches,
  createBatch,
  getProductsByBatchId,
  updateBatch,
  deleteBatch,
  updateProductInBatch,
  addProductToBatch,
};
