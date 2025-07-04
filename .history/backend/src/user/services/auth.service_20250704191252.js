const { getUserByEmail, isEmailExist, createUser, resetPass } = require("../models/user.model");
const { generateVerificationCode } = require("../utils/authUtils");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // ✅ thêm
const { sendVerificationEmail } = require("./email.service");

const JWT_SECRET = process.env.JWT_SECRET;  // ✅ lấy từ .env
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;  // ✅ lấy từ .env

//==========================LOGIN=========================
exports.login = async (email, password) => {
  const user = await getUserByEmail(email);

  if (!user) {
    throw new Error("Người dùng không tồn tại.");
  }

  const isMatch = await bcrypt.compare(password, user.Password);
  if (!isMatch) {
    throw new Error("Mật khẩu không chính xác.");
  }

  // ✅ Tạo payload chứa thông tin user
  const payload = {
    id: user.UserID,
    email: user.Email,
    name: user.DisplayName,
    role: user.Role,
  };

  // ✅ Tạo access token (ngắn hạn)
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "2s" });
  const decoded 1= jwt.verify(refreshTokens, JWT_REFRESH_SECRET);
console.log(decoded);

  // ✅ Tạo refresh token (dài hạn)
  const refreshTokens = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
  const decoded = jwt.verify(refreshTokens, JWT_REFRESH_SECRET);
console.log(decoded);

  return {
    message: "Đăng nhập thành công!",
    user: payload, // Có thể trả user riêng nếu frontend cần
    accessToken,
  };
};

//==========================KIỂM TRA MAIL VÀ TẠO CODE==============================
exports.checkEmailAndGenerateCode = async (email, use) => {
  const exists = await isEmailExist(email);

  if (use === "register" && exists) {
    return {
      success: false,
      message: "Email đã được sử dụng",
    };
  }

  if (use === "forgot" && !exists) {
    return {
      success: false,
      message: "❌ Email không tồn tại",
    };
  }

  const code = generateVerificationCode();
  return {
    success: true,
    code,
  };
};

//==========================GỬI MAIL XÁC THỰC==============================
exports.generateAndSendVerificationCode = async (email, use) => {
  const result = await exports.checkEmailAndGenerateCode(email, use);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  const code = result.code;

  const response = {
    success: true,
    code,
    message:
      use === "register"
        ? "✅ Mã xác thực đã được tạo. Đang gửi email..."
        : "📧 Mã khôi phục đã được gửi đến email của bạn!",
  };

  // Gửi email không blocking
  setTimeout(() => {
    sendVerificationEmail(email, code, use).catch((err) => {
      console.error("❌ Gửi email thất bại:", err.message);
    });
  }, 0);

  return response;
};

//==========================ĐĂNG KÝ==============================
exports.register = async (data) => {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    await createUser({
      ...data,
      password: hashedPassword,
    });

    return {
      success: true,
      message: "Đăng ký thành công.",
    };
  } catch (error) {
    console.error("❌ Lỗi trong service register:", error.message);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi đăng ký.",
    };
  }
};

//==========================RESET PASSWORD==============================
exports.resetPassword = async ({ email, code, newPassword, sessionData }) => {
  if (sessionData.code !== code) {
    throw new Error("Mã xác thực không đúng.");
  }

  if (sessionData.expireAt && sessionData.expireAt < Date.now()) {
    throw new Error("Mã xác thực đã hết hạn.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const result = await resetPass(email, hashedPassword);
  if (!result.success) {
    throw new Error("Không thể cập nhật mật khẩu.");
  }

  console.log(`✅ Đã đổi mật khẩu cho ${email}`);
};
