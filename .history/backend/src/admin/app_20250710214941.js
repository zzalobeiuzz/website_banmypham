const express = require("express");
const router = express.Router();

const AdminRouter = require("./routes/account.routes");
const ProductRouter = require("./routes/product.routes");

// 👇 Mount các route liên quan tới user
router.use("", Adminrouter);
router.use("", ProductRouter );
module.exports = router;
