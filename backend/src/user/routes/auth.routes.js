const express = require("express");
const router = express.Router();

// Import đúng
const {
	loginHandler,
	googleLoginHandler,
	facebookLoginHandler,
	registerHandler,
	resetPasswordHandler,
	sendVerificationCode,
	updateAvatarHandler,
	changePasswordHandler,
	getProfileHandler,
	updateProfileHandler,
} = require("../controllers/auth.controller");
const { validateLoginInput } = require("../middlewares/validateInput");
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../../admin/middlewares/upload.middleware");

// Định nghĩa route
router.post("/login", validateLoginInput, loginHandler);
router.post("/google-login", googleLoginHandler);
router.post("/facebook-login", facebookLoginHandler);

// Gửi thông tin đăng kí để tạo mới người dùng
router.post("/register", registerHandler);
// Quên mật khẩu -> kiểm tra email có tồn tại -> Gửi mã -> Kiểm tra mã -> Đổi mật khẩu 
router.post("/resetPassword", resetPasswordHandler);
// Gửi mã xác thực nếu email tồn tại
router.post("/sendVerificationCode", sendVerificationCode); 
// Cập nhật avatar mới cho người dùng đã đăng nhập
// Đổi mật khẩu cho người dùng đã đăng nhập
//	Lấy thông tin profile của người dùng đã đăng nhập
// Cập nhật thông tin profile (không bao gồm avatar) cho người dùng đã đăng nhập
router.put("/avatar", authMiddleware.verifyToken, upload.single("avatar"), updateAvatarHandler);
router.put("/change-password", authMiddleware.verifyToken, changePasswordHandler);
router.get("/profile", authMiddleware.verifyToken, getProfileHandler);
router.put("/update-profile", authMiddleware.verifyToken, updateProfileHandler);

module.exports = router;
