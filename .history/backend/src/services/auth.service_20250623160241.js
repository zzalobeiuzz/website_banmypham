// services/auth.service.js
const User = require("../models/user.model");

exports.login = async (email, password) => {
    const user = await User({ email, password });
  
    if (!user) {
      throw new Error("Người dùng không tồn tại.");
    }
  
    const isMatch = await bcrypt.compare(password, user.password);
  
    if (!isMatch) {
      throw new Error("Mật khẩu không chính xác.");
    }
  
    // Trả về thông tin (hoặc tạo JWT token tại đây)
    return {
      message: "Đăng nhập thành công!",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token: "fake-jwt-token", // hoặc dùng JWT để tạo
    };
  };