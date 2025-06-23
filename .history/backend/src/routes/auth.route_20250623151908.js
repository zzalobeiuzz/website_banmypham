//============= Khai báo biến và các hàm
const express = require("express");
const app = express();
const authRoutes = require("./routes/auth.routes");

// Middleware để đọc JSON từ client
app.use(express.json());

// Gắn router
app.use("/api/auth", authRoutes);

// Xử lý route không tồn tại (404)
app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy endpoint." });
});
