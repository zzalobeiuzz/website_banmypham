const express = require("express");
const router = express.Router();

const AdminRouter = require("./routes/account.routes");
const ProductRouter = require("./routes/product.routes");
const CategoryRouter = require("./routes/category.routes");

// 👇 Mount các route liên quan tới user
router.use("", AdminRouter);
router.use("/products", ProductRouter );
router.use("/categories", CategoryRouter);
module.exports = router;
