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




// ✅ Áp dụng parse JSON và form-data trước
app.use(express.json({ limit: "500mb" })); 
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

app.use("/uploads", express.static(path.join(__dirname, "./uploads")));
app.use(sessionMiddleware);

// 👉 Mount routes sau khi đã parse
const userRoutes = require("./user/app");
const adminRoutes = require("./admin/app");

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

app.get("/", (req, res) => {
  res.send("🚀 Server đang hoạt động!");
});

// ✅ Cron job dọn dẹp
cron.schedule("0 0 * * *", () => {
  console.log("🧹 Running cleanUploads job...");
  cleanUploads();
});

// ✅ Hoặc chạy test ngay
// cleanUploads();

module.exports = app;
