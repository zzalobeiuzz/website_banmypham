const express = require("express");
const router = express.Router();

const {
	getAllBatches,
	createBatch,
	getProductsByBatchId,
	addProductToBatch,
	updateBatch,
	deleteBatch,
	updateProductInBatch,
} = require("../controllers/batch.controller");

router.get("/", getAllBatches);
router.post("/", createBatch);
router.get("/:batchId/products", getProductsByBatchId);
router.post("/:batchId/products", addProductToBatch);
router.put("/:batchId/products", updateProductInBatch);
router.put("/:batchId", updateBatch);
router.delete("/:batchId", deleteBatch);

module.exports = router;
