const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/verifyToken.middleware");
const upload = require("../middlewares/upload.middleware");
const {
  handleGetSaleEvents,
  handleGetUnavailableProductSales,
  handleGetSaleEventDetail,
  handleCreateProductSale,
  handleDeleteProductSale,
  handleCreateSaleEvent,
  handleUpdateSaleEvent,
  handleDeleteSaleEvent,
} = require("./saleEvent.controller");

router.use(authMiddleware.verifyToken, authMiddleware.verifyAdmin);

router.get("/unavailable-products", handleGetUnavailableProductSales);
router.get("/", handleGetSaleEvents);
router.post("/product-sale", handleCreateProductSale);
router.delete("/product-sale/:id", handleDeleteProductSale);
router.get("/:id", handleGetSaleEventDetail);
router.post("/", upload.single("bannerFile"), handleCreateSaleEvent);
router.put("/:id", upload.single("bannerFile"), handleUpdateSaleEvent);
router.delete("/:id", handleDeleteSaleEvent);

module.exports = router;
