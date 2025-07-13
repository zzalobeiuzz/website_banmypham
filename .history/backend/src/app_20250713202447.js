const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const sessionMiddleware = require("./config/session"); // File session config

const app = express();

// 💥 Config CORS
app.use(cors({
  origin: "http://localhost:3000", // FE domain
  credentials: true,
}));

app.use(express.json());

// 💥 Config file upload (dùng cho quill hoặc ảnh sản phẩm)
app.use(fileUpload());

// 💥 Static để client truy cập file ảnh
app.use("/uploads", express.static(__dirname + "/uploads"));

// 💥 Session middleware
app.use(sessionMiddleware);

// 💥 Import routes
const userRoutes = require("./user/app");
const adminRoutes = require("./admin/app");

// 💥 Mount routes
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// 💥 Test route
app.get("/", (req, res) => {
  res.send("✅ Server đang hoạt động!");
});

// 💥 Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
