const express = require("express");
const router = express.Router();

const productRoutes = require("./routes/products.routes");
const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/order.routes");
const voucherRoutes = require("./routes/voucher.routes");
// 👇 Mount các route liên quan tới user
router.use("/products", productRoutes);
router.use("/auth", authRoutes);
router.use("/orders", orderRoutes);
router.use("/vouchers", voucherRoutes);

module.exports = router;
