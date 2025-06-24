const express = require("express");
const router = express.Router();

// Import đúng
const { loginHandler } = require("../controllers/auth.controller");
const { validateLoginInput } = require("../middlewares/validateInput");

// Định nghĩa route
router.post("/login", validateLoginInput, loginHandler);

router.post("/regi")

module.exports = router;
