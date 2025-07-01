const {
  login,
  checkEmailAndGenerateCode,
  register,
  generateAndSendVerificationCode,
  resetPassword,
} = require("../services/auth.service");

//================= Xử lý đăng nhập =================
exports.loginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);

    res.status(200).json(result);
    console.log("✅ Đăng nhập thành công");
  } catch (err) {
    console.error("❌ Lỗi khi đăng nhập:", err.message);

    if (
      err.message === "Người dùng không tồn tại." ||
      err.message === "Mật khẩu không chính xác."
    ) {
      return res.status(401).json({ message: err.message });
    }

    res.status(500).json({ message: "Lỗi server khi đăng nhập." });
  }
};

//================= Xử lý đăng ký =================
exports.registerHandler = async (req, res) => {
  try {
    const result = await register(req.body);
    res.status(200).json(result);
    console.log("✅ Đăng ký thành công");
  } catch (err) {
    console.error("❌ Lỗi khi đăng ký:", err.message);
    res.status(500).json({ success: false, message: "Lỗi server khi đăng ký." });
  }
};

//================= Xử lý gửi mã xác thực =================
exports.sendVerificationCode = async (req, res) => {
  const { email, use } = req.body;

  // Check thiếu field
  if (!email || !use) {
    return res.status(400).json({
      success: false,
      message: "Thiếu email hoặc mục đích (use).",
    });
  }

  try {
    // Gọi service (service đã gửi email luôn)
    const result = await generateAndSendVerificationCode(email, use);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    const code = result.code;

    // 🔑 Nếu chưa có object verifications, khởi tạo
    if (!req.session.verifications) {
      req.session.verifications = {};
    }

    // 💾 Lưu code và thời hạn vào session (key = email)
    req.session.verifications[email] = {
      code,
      expireAt: Date.now() + 15 * 60 * 1000, // 15 phút
    };

    // Save session
    req.session.save((err) => {
      if (err) {
        console.error("❌ Lỗi lưu session:", err);
        return res.status(500).json({ success: false, message: "Lỗi lưu session." });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        code: 
      });
    });
  } catch (err) {
    console.error("❌ Lỗi xử lý sendVerificationCode:", err.message);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi phía server.",
    });
  }
};

//================= Xử lý reset password =================
exports.resetPasswordHandler = async (req, res) => {
  try {
    const { code, newPassword, email } = req.body;

    // Check thiếu trường
    if (!code || !newPassword || !email) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin cần thiết." });
    }

    // Lấy verifications từ session
    const verifications = req.session.verifications || {};
    const sessionData = verifications[email];

    if (!sessionData) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy mã xác thực cho email này.",
      });
    }

    // Gọi service (kiểm tra code, hạn, update DB)
    await resetPassword({
      email,
      code,
      newPassword,
      sessionData,
    });

    // Xoá session key
    delete req.session.verifications[email];

    // Save lại session
    req.session.save((err) => {
      if (err) {
        console.error("❌ Lỗi khi lưu session sau xóa:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi lưu session." });
      }

      return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công!" });
    });
  } catch (err) {
    console.error("❌ Lỗi reset password:", err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};
