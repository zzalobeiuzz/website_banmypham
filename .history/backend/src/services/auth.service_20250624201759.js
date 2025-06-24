const { getUserByEmail, isEmailExist } = require("../models/user.model");

exports.login = async (email, password) => {
  const user = await getUserByEmail(email);

  if (!user) {
    throw new Error("Người dùng không tồn tại.");
  }

  //So sánh mật khẩu được POST với cơ sở dữ liệu 
  const isMatch = password === user.Password;

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
    throw new Error("Email đã được sử dụng");
  }

  // Tạo mã xác thực
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
};
