const express = require("express");
const router = express.Router();

const {
  getHomeBannerEventsHandler,
  getEventProductsHandler,
  getActivePromotionProgramsHandler,
} = require("../controllers/event.controller");

router.get("/home-banners", getHomeBannerEventsHandler);
router.get("/active-programs", getActivePromotionProgramsHandler);
router.get("/:id/products", getEventProductsHandler);

module.exports = router;
