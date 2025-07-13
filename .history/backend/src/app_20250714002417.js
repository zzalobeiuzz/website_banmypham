const express = require("express");
const cors = require("cors");
const sessionMiddleware = require("./config/session");
const fileUpload = require("express-fileupload");
const path = require("path");
const cron = require("node-cron");
const cleanUploads = require("./cleanUploads"); // 👉 import file dọn dẹp

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(fileUpload());

app.use("/uploads", express.static(path.join(__dirname, "./uploads"))); // nhớ chỉnh đúng folder

app.use(sessionMiddleware);

const userRoutes = require("./user/app");
const adminRoutes = require("./admin/app");

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Server đang hoạt động!");
});

// ✅ Gọi cron job chạy mỗi ngày lúc 0h (12h đêm)
cron.schedule("0 0 * * *", () => {
  console.log("🧹 Running cleanUploads job...");
  cleanUploads();
});

// ✅ Hoặc nếu muốn chạy thử ngay 1 lần khi start server
// cleanUploads();

module.exports = app;
