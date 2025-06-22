//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const {
    loginHandler,
} = require("../controllers/auth.controller")

router.get("/")