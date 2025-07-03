//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const{verifyToken,verifyAdmin} = require("../middlewares/verifyToken.middleware")
// Định nghĩa các route trong Express Router
router.get("/", );
module.exports = router;