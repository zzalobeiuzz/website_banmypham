// services/auth.service.js

exports.login = async (email, password) => {
    // Giả lập dữ liệu người dùng
    const fakeUser = {
      email: "test@example.com",
      password: "123456", // Mật khẩu mẫu
      name: "Test User",
    };
  
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
  