const express = require("express");
const router = express.Router();

const Adminrouter = require("./routes/account.routes");
const authRoutes = require("./routes/auth.routes");

// 👇 Mount các route liên quan tới user
router.use("/", Adminrouter);
router.use("/auth", authRoutes);

module.exports = router;
