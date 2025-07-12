const express = require("express");
const router = express.Router();

const AdminRouter = require("./routes/account.routes");
const ProductRouter = require("./routes/s");

// 👇 Mount các route liên quan tới user
router.use("", AdminRouter);
router.use("/products", ProductRouter );
module.exports = router;
