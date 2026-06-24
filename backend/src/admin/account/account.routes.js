const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/verifyToken.middleware");
const upload = require("../middlewares/upload.middleware");
const {
  refreshToken,
  handleGetAccounts,
  handleCreateAccount,
  handleUpdateAccount,
  handleResetAccountPassword,
  handleDeleteAccount,
} = require("./account.controller");

router.get("/", authMiddleware.verifyToken, authMiddleware.verifyAdmin, (req, res) => {
  res.json({
    message: "Hello Admin! Bạn đã được xác thực.",
    user: req.user,
  });
});

router.post("/refresh-token", refreshToken);
router.get("/accounts", authMiddleware.verifyToken, authMiddleware.verifyAdmin, handleGetAccounts);
router.post("/accounts", authMiddleware.verifyToken, authMiddleware.verifyAdmin, upload.single("avatarFile"), handleCreateAccount);
router.put("/accounts/:email", authMiddleware.verifyToken, authMiddleware.verifyAdmin, upload.single("avatarFile"), handleUpdateAccount);
router.put("/accounts/:email/reset-password", authMiddleware.verifyToken, authMiddleware.verifyAdmin, handleResetAccountPassword);
router.delete("/accounts/:email", authMiddleware.verifyToken, authMiddleware.verifyAdmin, handleDeleteAccount);

module.exports = router;
