//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const {
    loginHandler,
} = require("../controllers/auth.controller")
const{

} = require
//Kiểm tra đầu vào trước khi đưa dữ liệu tới controller
router.post("/login", validateLoginInput, loginHandler);

module.exports = router;