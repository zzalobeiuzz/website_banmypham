const express = require("express");
const cors = require("cors");
const sessionMiddleware = require("./config/session");
const fileUpload = require("express-fileupload");
const path = require("path");

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(fileUpload());

// ✅ Chỉ cần thế này, đúng với folder chứa ảnh
app.use("/uploads", express.static(path.join(__dirname, "../")));




app.use(sessionMiddleware);

const userRoutes = require("./user/app");
const adminRoutes = require("./admin/app");

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Server đang hoạt động!");
});

module.exports = app;
