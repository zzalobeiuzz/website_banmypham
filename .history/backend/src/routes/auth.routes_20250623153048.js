// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const { loginHandler } = require("../controllers/auth.controller");
const { validateLoginInput } = require("../");

// POST /api/auth/login
router.post("/login", validateLoginInput, loginHandler);

module.exports = router;
