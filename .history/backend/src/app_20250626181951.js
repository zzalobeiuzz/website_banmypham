const express = require("express");
const cors = require("cors");
const app = express();

// ⚙️ Middleware
app.use(cors());
app.use(express.json());

// 🔗 Import routes từ user và admin
const userRoutes = require("./user/app");
// const adminRoutes = require("./admin/app");

// 🛣 Mount các module với prefix cụ thể
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// 🧪 Route test
app.get("/", (req, res) => {
  res.send("✅ Server đang hoạt động!");
});

module.exports = app;
