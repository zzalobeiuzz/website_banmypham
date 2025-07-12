const express = require("express");
const router = express.Router();

const Arouter = require("./routes/account.routes");
const Adminrouter = require("./routes/account.routes");

// 👇 Mount các route liên quan tới user
router.use("", Adminrouter);

module.exports = router;
