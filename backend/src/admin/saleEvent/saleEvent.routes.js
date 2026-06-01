const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/verifyToken.middleware");
const upload = require("../middlewares/upload.middleware");
const {
  handleGetSaleEvents,
  handleCreateSaleEvent,
} = require("./saleEvent.controller");

router.use(authMiddleware.verifyToken, authMiddleware.verifyAdmin);

router.get("/", handleGetSaleEvents);
router.post("/", upload.single("bannerFile"), handleCreateSaleEvent);

module.exports = router;