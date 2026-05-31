const express = require("express");
const router = express.Router();

const { getPublicVouchersHandler, validateVoucherCodeHandler } = require("../controllers/voucher.controller");

router.get("/", getPublicVouchersHandler);
router.get("/validate", validateVoucherCodeHandler);

module.exports = router;