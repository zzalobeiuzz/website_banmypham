const express = require("express");
const router = express.Router();

const { loginHandler, sendVerificationCode, registerHandler, resetPasswordHandler } = require("../controllers/auth.controller");
const { validateLoginInput } = require("../middlewares/validateInput");

router.post("/login", validateLoginInput, loginHandler);
router.post("/register", registerHandler);
router.post("/resetPassword", resetPasswordHandler);
router.post("/sendVerificationCode", sendVerificationCode);

module.exports = router;
