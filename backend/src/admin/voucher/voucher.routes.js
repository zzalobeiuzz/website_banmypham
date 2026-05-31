const express = require("express");
const router = express.Router();

const { handleGetVouchers } = require("./voucher.controller");
const { handleCreateVoucher } = require("./voucher.controller");
const { handleUpdateVoucher } = require("./voucher.controller");
const { handleDeleteVoucher } = require("./voucher.controller");
const authMiddleware = require("../middlewares/verifyToken.middleware");

router.use(authMiddleware.verifyToken, authMiddleware.verifyAdmin);

router.get("/", handleGetVouchers);
router.post("/", handleCreateVoucher);
router.put("/:id", handleUpdateVoucher);
router.delete("/:id", handleDeleteVoucher);

module.exports = router;