const { getUserByEmail, isEmailExist, createUser } = require("../models/user.model");
const { generateVerificationCode } = require("../utils/authUtils");
const bcrypt = require("bcrypt");
const {sendVerificationEmail} = require("./email.service")

//==========================LOGIN=========================
exports.login = async (email, password) => {
  const user = await getUserByEmail(email);

  if (!user) {
    throw new Error("Người dùng không tồn tại.");
  }

  // 🧠 Mã hóa mật khẩu đã nhập vào so sánh với mk đã lưu dưới dạng mã hóa trong db
  const isMatch = await bcrypt.compare(password, user.Password);
  //Nếu là False thì không chính xác
  if (!isMatch) {
    throw new Error("Mật khẩu không chính xác.");
  }
  //Nếu là còn ngược lại thì không chính xác
  return {
    message: "Đăng nhập thành công!",
    user: {
      id: user.UserID,
      email: user.Email,
      name: user.DisplayName,
      role: user.Role,
    },
    token: "fake-jwt-token", // TODO: Thay bằng jwt.sign(...) nếu cần
  };
};

//==========================KIỂM TRA MAIL VÀ TẠO CODE==============================
exports.checkEmailAndGenerateCode = async (email, use) => {
  const exists = await isEmailExist(email);
  // 👉 Trường hợp dùng cho ĐĂNG KÝ
  if (use === "register") {
    if (exists) {
      return {
        success: false,
        message: "Email đã được sử dụng",
      };
    }
  }

  // 👉 Trường hợp dùng cho QUÊN MẬT KHẨU
  if (use === "forgot") {
    if (!exists) {
      return {
        success: false,
        message: "❌ Email không tồn tại",
      };
    }
  }

  // ✅ Tạo mã xác thực
  const code = generateVerificationCode();

  return {
    success: true,
    code,
  };
};
//==========================
const verificationCodes = {}; // Bộ nhớ tạm lưu các mã xác thực đã gửi

exports.generateAndSendVerificationCode = async (email, use) => {
  const result = await exports.checkEmailAndGenerateCode(email, use);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  const code = result.code;
  verificationCodes[email] = code;

  // ✅ Trả về ngay
  const response = {
    success: true,
    code,
    message:
      use === "register"
        ? "✅ Mã xác thực đã được tạo. Đang gửi email..."
        : "📧 Mã khôi phục đã được gửi đến email của bạn!",
  };

  // ✅ Gửi mail song song, không đợi
  setTimeout(() => {
    sendVerificationEmail(email, code, use).catch((err) => {
      console.error("❌ Gửi email thất bại:", err.message);
    });
  }, 0); // dùng setTimeout để tách hẳn khỏi callstack sync

  return response;
};
/*=========📌 Đăng ký tài khoản mới người dùng========*/
exports.register = async (data) => {
  try {
    // 🔒 Băm (hash) mật khẩu để đảm bảo an toàn
    const hashedPassword = await bcrypt.hash(data.password, 10);
    console.error("❌ mã hóa", hashedPassword);
    // ✅ Gọi model để tạo user mới trong cơ sở dữ liệu
    await createUser({
      ...data,
      password: hashedPassword, // Ghi đè mật khẩu plain text
    });

    // ✅ Trả về kết quả thành công
    return {
      success: true,
      message: "Đăng ký thành công.",
    };
  } catch (error) {
    console.error("❌ Lỗi trong service register:", error.message);

    // ⛔ Trả về lỗi nếu có vấn đề xảy ra
    return {
      success: false,
      message: "Đã xảy ra lỗi khi đăng ký.",
    };
  }
};
// =========================
exports.resetPassword = async ({ email, code, newPassword }) => {
  // 🔎 Tìm user
  const user = await isEmailExist(email);
  if (!user) {
    throw new Error("Không tìm thấy người dùng.");
  }

  // ✅ Kiểm tra code
  if (user.verificationCode !== code) {
    throw new Error("Mã xác thực không đúng.");
  }

  // (Optional) Check thời hạn code
  // if (user.codeExpiredAt && user.codeExpiredAt < Date.now()) {
  //   throw new Error("Mã đã hết hạn.");
  // }

  // 🔒 Băm mật khẩu mới
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // ✅ Cập nhật
  user.password = hashedPassword;
  user.verificationCode = undefined;
  user.codeExpiredAt = undefined;

  await user.save();
};