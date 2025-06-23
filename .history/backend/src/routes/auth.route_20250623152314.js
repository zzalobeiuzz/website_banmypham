const express = require("express");
const cors = require("cors");
const app = express();

// Middleware parse JSON
app.use(express.json());
app.use(cors());

// Import routes
const authRoutes = require("./routes/auth.routes");

// Gắn route
app.use("/api/auth", authRoutes);

// Lắng nghe cổng 5000
app.listen(5000, () => {
  console.log("✅ Server đang chạy tại http://localhost:5000");
});
