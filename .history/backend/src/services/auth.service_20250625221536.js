const { getUserByEmail, isEmailExist, createUser } = require("../models/user.model");
const bcrypt = require("bcrypt");

exports.login = async (email, password) => {
  const user = await getUserByEmail(email);

  if (!user) {
    throw new Error("Người dùng không tồn tại.");
  }

  // 🧠 So sánh mật khẩu đã mã hóa
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

exports.checkEmailAndGenerateCode = async (email) => {
  const exists = await isEmailExist(email);

  if (exists) {
    return {
      success: false,
      message: "Email đã được sử dụng",
    };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return {
    success: true,
    code,
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
