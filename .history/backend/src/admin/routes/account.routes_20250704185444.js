//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const{verifyToken,verifyAdmin} = require("../middlewares/verifyToken.middleware")
// Định nghĩa các route trong Express Router
// Route kiểm tra admin
router.get("/", verifyToken, verifyAdmin, (req, res) => {
    res.json({
      message: "Hello Admin! Bạn đã được xác thực.",
      user: req.user,
    });
  });
router.get
module.exports = router;