const { getUserByEmail } = require("../models/user.model");
const bcrypt = require("bcrypt"); // Đảm bảo đã cài: npm i bcrypt

exports.login = async (email, password) => {
  const user = await getUserByEmail(email);

  if (!user) {
    throw new Error("Người dùng không tồn tại.");
  }

  const isMatch = password === user.Password;


  if (!isMatch) {
    throw new Error("Mật khẩu không chính xác.");
  }

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
