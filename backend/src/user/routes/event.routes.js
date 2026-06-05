const express = require("express");
const router = express.Router();

const { getHomeBannerEventsHandler } = require("../controllers/event.controller");

router.get("/home-banners", getHomeBannerEventsHandler);

module.exports = router;
