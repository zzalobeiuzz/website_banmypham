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
app.use("/api/chat", require("./chat/chat.routes"));
app.use("/api/support-requests", require("./support/supportRequest.routes"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => {
  res.send("🚀 Server đang hoạt động!");
});

// 🔒 Cron job concurrency guards
let isCleanupRunning = false;
const CLEANUP_TIMEOUT_MS = 55000; // 55 seconds (safer than 60s interval)

// // ✅ Cron job dọn dẹp
// cron.schedule("0 0 * * *", () => {
//   console.log("🧹 Running cleanUploads job...");
//   cleanUploads();
// });

// ✅ Xóa đơn chờ thanh toán quá 10 phút (với concurrency guard)
cron.schedule("*/1 * * * *", async () => {
  // 🔒 Prevent concurrent executions
  if (isCleanupRunning) {
    console.warn("⚠️  Cleanup job skipped (previous execution still running)");
    return;
  }

  isCleanupRunning = true;
  const startTime = Date.now();

  try {
    // ⏱️ Wrap with timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Cleanup timeout exceeded")), CLEANUP_TIMEOUT_MS)
    );

    const cleanupPromise = cleanupExpiredPendingOrders(10);
    const result = await Promise.race([cleanupPromise, timeoutPromise]);

    const duration = Date.now() - startTime;
    if (result.deletedOrders > 0 || result.deletedDetails > 0) {
      console.log(
        `🧹 Cleanup done in ${duration}ms: ${result.deletedOrders} orders, ${result.deletedDetails} details`
      );
    } else if (duration > 1000) {
      console.log(`⏱️  Cleanup took ${duration}ms (no records deleted)`);
    }
  } catch (err) {
    console.error(`❌ Cleanup error: ${err.message} (${Date.now() - startTime}ms)`);
  } finally {
    isCleanupRunning = false;
  }
});

// ✅ Hoặc chạy test ngay
// cleanUploads();

module.exports = app;
