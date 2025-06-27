const { getUserByEmail, isEmailExist, createUser } = require("../models/user.model");
const { generateVerificationCode } = require("../utils/authUtils");
const bcrypt = require("bcrypt");

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
  console.log("📌 DEBUG exists =", exists, "| use =", use); // THÊM DÒNG NÀY

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
  const result = await checkEmailAndGenerateCode(email, use);

  console.log("✅ Kết quả kiểm tra email:", {
    email,
    use,
    success: result.success,
    message: result.message,
  });

  if (!result.success) {
    console.log("⛔ KHÔNG thành công, dừng lại.");
    return {
      success: false,
      message: result.message,
    };
  }

  const code = result.code;
  verificationCodes[email] = code;

  // ✅ Gửi email không đồng bộ
  setImmediate(() => {
    sendVerificationEmail(email, code, use).catch((err) => {
      console.error("❌ Gửi email thất bại:", err.message);
    });
  });

  return {
    success: true,
    code,
    message:
      use === "register"
        ? "✅ Mã xác thực đã được tạo. Đang gửi email..."
        : "📧 Mã khôi phục đã được gửi đến email của bạn!",
  };
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
