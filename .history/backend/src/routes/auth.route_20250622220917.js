//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const {
    loginHandler,
} = require("../controllers/auth.controller")

router.post("/login", validateLoginInput, loginHandler);

module.exports = router;