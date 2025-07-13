const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload"); // 🟢 Thêm để xử lý file
const path = require("path");
const app = express();

const sessionMiddleware = require("./config/session"); // 💥 Import session

// ⚙️ Middleware
app.use(cors({
  origin: "http://localhost:3000", // FE domain
  credentials: true,
}));
app.use(express.json());

// 🟢 Thêm middleware xử lý file upload
app.use(fileUpload());

// 🟢 Public folder chứa ảnh để FE có thể truy cập
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 💥 Session
app.use(sessionMiddleware);

// 🔗 Import routes
const userRoutes = require("./user/app");
const adminRoutes = require("./admin/app");

// 🛣 Mount các module với prefix
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// 🧪 Route test
app.get("/", (req, res) => {
  res.send("✅ Server đang hoạt động!");
});

module.exports = app;
