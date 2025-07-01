const express = require("express");
const cors = require("cors");
const app = express();

const sessionMiddleware = require("./config/session"); // 💥 Import session

// ⚙️ Middleware
app.use(cors());
app.use(express.json());

// 💥 Sử dụng middleware session trước routes
app.use(sessionMiddleware);

// 🔗 Import routes từ user và admin
const userRoutes = require("./user/app");
// const adminRoutes = require("./admin/app");

// 🛣 Mount các module với prefix cụ thể
app.use("/api/user", userRoutes);
// app.use("/api/admin", adminRoutes);

// 🧪 Route test
app.get("/", (req, res) => {
  res.send("✅ Server đang hoạt động!");
});
app.get("/test-session", (req, res) => {
  req.session.username = "huy";
  res.send("✅ Đã set session, check cookie nhé!");
});
module.exports = app;
