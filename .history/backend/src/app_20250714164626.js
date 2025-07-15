const express = require("express");
const cors = require("cors");
const sessionMiddleware = require("./config/session");
const path = require("path");
const cron = require("node-cron");
const cleanUploads = require("./cleanUploads");

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// 💥 Không dùng fileUpload() nữa
// app.use(fileUpload());

app.use("/uploads", express.static(path.join(__dirname, "./uploads")));
app.use(sessionMiddleware);

// 👉 Mount route admin trước
const userRoutes = require("./user/app");
const adminRoutes = require("./admin/app");

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Chỉ áp dụng JSON parse cho các route khác (không upload)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("🚀 Server đang hoạt động!");
});

// ✅ Cron job dọn dẹp
cron.schedule("0 0 * * *", () => {
  console.log("🧹 Running cleanUploads job...");
  cleanUploads();
});

// ✅ Hoặc nếu muốn chạy thử ngay
// cleanUploads();

module.exports = app;
