const express = require("express");
const cors = require("cors");
const sessionMiddleware = require("./config/session");
const fileUpload = require("express-fileupload");

const app = express();

// ⚙️ Middleware
app.use(cors({
  origin: "http://localhost:3000", // Đổi sang domain FE nếu cần
  credentials: true,
}));
app.use(express.json());
app.use(fileUpload()); // 👈 Middleware xử lý file upload
// 💥 Trỏ đúng thư mục uploads của em
app.use("/uploads", express.static(path.join(__dirname, "admin/uploads")));

// 💥 Session
app.use(sessionMiddleware);

// 📂 Import routes
const userRoutes = require("./user/app");
const adminRoutes = require("./admin/app");

// 🛣 Mount routes
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Route test
app.get("/", (req, res) => {
  res.send("🚀 Server đang hoạt động!");
});

module.exports = app;
