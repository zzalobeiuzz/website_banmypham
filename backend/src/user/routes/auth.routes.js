const express = require("express");
const router = express.Router();

// Import đúng
const {
	loginHandler,
	googleLoginHandler,
	facebookLoginHandler,
	sendVerificationCode,
	registerHandler,
	resetPasswordHandler,
	updateAvatarHandler,
	changePasswordHandler,
	updateProfileHandler,
	getProfileHandler,
} = require("../controllers/auth.controller");
const { validateLoginInput } = require("../middlewares/validateInput");
const { verifyToken } = require("../middlewares/auth.middleware");
const upload = require("../../admin/middlewares/upload.middleware");

// Định nghĩa route
router.post("/login", validateLoginInput, loginHandler);
router.post("/google-login", googleLoginHandler);
router.post("/facebook-login", facebookLoginHandler);

// Gửi thông tin đăng kí để tạo mới người dùng
router.post("/register", registerHandler);
// Quên mật khẩu -> kiểm tra email có tồn tại -> Gửi mã -> Kiểm tra mã -> Đổi mật khẩu 
router.post("/resetPassword",resetPasswordHandler);
// Gửi mã xác thực nếu email tồn tại
router.post("/sendVerificationCode", sendVerificationCode); 
// Cập nhật avatar mới cho người dùng đã đăng nhập
router.put("/avatar", verifyToken, upload.single("avatar"), updateAvatarHandler);
// Đổi mật khẩu cho người dùng đã đăng nhập
router.put("/change-password", verifyToken, changePasswordHandler);
//	Lấy thông tin profile của người dùng đã đăng nhập
router.get("/profile", verifyToken, getProfileHandler);
// Cập nhật thông tin profile (không bao gồm avatar) cho người dùng đã đăng nhập
router.put("/update-profile", verifyToken, updateProfileHandler);

module.exports = router;
