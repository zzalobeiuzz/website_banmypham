// services/auth.service.js
const User = require("../models/user.model");
exports.login = async (email, password) => { 
    // Kiểm tra email và password

    if (email !== fakeUser.email || password !== fakeUser.password) {
      throw new Error("Email hoặc mật khẩu không đúng.");
    }
  
    // Trả về token giả (hoặc thông tin người dùng)
    return {
      message: "Đăng nhập thành công!",
      user: {
        name: fakeUser.name,
        email: fakeUser.email,
      },
      token: "fake-jwt-token",
    };
  };
  