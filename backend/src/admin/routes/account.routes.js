//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const{verifyToken,verifyAdmin} = require("../middlewares/verifyToken.middleware")
const{refreshToken} = require("../controllers/account.controller")

// GET /api/admin/
// Dùng để xác thực token hiện tại có đúng quyền admin hay không.
router.get("/", verifyToken, verifyAdmin, (req, res) => {
    res.json({
      message: "Hello Admin! Bạn đã được xác thực.",
      user: req.user,
    });
  });

// POST /api/admin/refresh-token
// Dùng refresh token để cấp access token mới khi access token hết hạn.
router.post("/refresh-token",refreshToken)
module.exports = router;