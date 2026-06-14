const express = require("express");
const router = express.Router();
const controller = require("./supportRequest.controller");
const authMiddleware = require("../admin/middlewares/verifyToken.middleware");

router.post("/", authMiddleware.verifyToken, controller.createSupportRequest);
router.get("/admin", authMiddleware.verifyAdmin, controller.listSupportRequests);
router.patch("/admin/:id/read", authMiddleware.verifyAdmin, controller.markSupportRequestRead);

module.exports = router;
