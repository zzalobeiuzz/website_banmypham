const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/products.routes");
const authRoutes = require("./routes/auth.route"); // ✅ Thêm dòng này

const app = express();
app.use(cors());
app.use(express.json());

// Mount các routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes); // ✅ Thêm dòng này

// Route kiểm tra
app.get("/", (req, res) => {
  res.send("Server đang hoạt động!");
});

module.exports = app;
