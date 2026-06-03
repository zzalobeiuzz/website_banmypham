const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middlewares/verifyToken.middleware");
const statsController = require("./stats.controller");

// GET /api/admin/stats
router.get("/overview", verifyAdmin, statsController.handleGetOverview);
router.get("/", verifyAdmin, statsController.handleGetStats);

module.exports = router;
