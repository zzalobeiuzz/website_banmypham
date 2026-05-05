const express = require("express");
const cors = require("cors");
const sessionMiddleware = require("./config/session");
const path = require("path");
const cron = require("node-cron");
// const cleanUploads = require("./cleanUploads");
const { cleanupExpiredPendingOrders } = require("./user/models/order.model");

const app = express();

// ✅Cấu hình cho phép frontend gọi API:
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  
}));

// ✅ Áp dụng parse JSON và form-data trước
app.use(express.json({ limit: "500mb" })); 
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

app.use(sessionMiddleware);

// 👉 Mount routes sau khi đã parse
const userRoutes = require("./user/app");
const adminRoutes = require("./admin/app");
const paymentRoutes = require("./payment/app");

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => {
  res.send("🚀 Server đang hoạt động!");
});

// // ✅ Cron job dọn dẹp
// cron.schedule("0 0 * * *", () => {
//   console.log("🧹 Running cleanUploads job...");
//   cleanUploads();
// });

// ✅ Xóa đơn chờ thanh toán quá 10 phút
cron.schedule("*/1 * * * *", async () => {
  try {
    const result = await cleanupExpiredPendingOrders(10);
    if (result.deletedOrders > 0 || result.deletedDetails > 0) {
      console.log(
        `🧹 Removed expired pending orders: ${result.deletedOrders} orders, ${result.deletedDetails} details`
      );
    }
  } catch (err) {
    console.error("❌ cleanupExpiredPendingOrders error:", err);
  }
});

// ✅ Hoặc chạy test ngay
// cleanUploads();

module.exports = app;
