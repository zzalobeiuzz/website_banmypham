const express = require("express");
const router = express.Router();

const productRoutes = require("./routes/products.routes");
const authRoutes = require("./routes/auth.routes");

// 👇 Mount các route liên quan tới user
router.use("/products", productRoutes);
router.use("/auth", authRoutes);

module.exports = router;
