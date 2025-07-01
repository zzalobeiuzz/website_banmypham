const { login, checkEmailAndGenerateCode, register,generateAndSendVerificationCode,resetPassword } = require("../services/auth.service");
const nodemailer = require("nodemailer");


//=================Xử lý đăng nhập=======================
exports.loginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.status(200).json(result);
    console.log("Đăng nhập thành công")
    console.log("======================================")
  } catch (err) {
    console.error("❌ Lỗi khi đăng nhập:", err.message);

    // Kiểm tra lỗi do mật khẩu hoặc tài khoản
    if (
      err.message === "Người dùng không tồn tại." ||
      err.message === "Mật khẩu không chính xác."
    ) {
      return res.status(401).json({ message: err.message });
    }

    // Lỗi khác (lỗi server)
    res.status(500).json({ message: "Lỗi server khi đăng nhập." });
  }
};
//=========================== Đăng kí mới người dùng ==============================
exports.registerHandler = async (req, res) => {
  try {
    const result = await register(req.body);
    res.status(200).json(result);
    console.log("Đăng kí thành công")
    console.log("======================================")
  }
  catch (err) {
    console.error("❌ Lỗi khi đăng kí:", err.message);

  }
};
//=========================== Xử lý kiểm tra email gửi mã =======================
exports.sendVerificationCode = async (req, res) => {
  const { email, use } = req.body;

  if (!email || !use) {
    return res.status(400).json({
      success: false,
      message: "Thiếu email hoặc mục đích (use)",
    });
  }

  try {
    // Service đã gửi mail luôn
    const result = await generateAndSendVerificationCode(email, use);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    const code = result.code;
    // 💾 Lưu session
    req.session.verification = {
      email,
      code,
      expireAt: Date.now() + 15 * 60 * 1000,
    };

    // ✅ Trả response
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    console.error("❌ Lỗi xử lý sendVerificationCode:", err.message);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi phía server.",
    });
  }
};

//====================== RESET PASSWORD ==================
exports.resetPasswordHandler = async (req, res) => {
  try {
    const { code, newPassword } = req.body;

    // Check thiếu trường
    if (!code || !newPassword) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin cần thiết." });
    }
    // Lấy email và code từ session
    const sessionData = req.session.verification;

    if (!sessionData || !sessionData.email || !sessionData.code) {
      return res.status(400).json({ success: false, message: "Không tìm thấy thông tin xác thực trong session." });
    }

    // Kiểm tra code
    if (sessionData.code !== code) {
      return res.status(400).json({ success: false, message: "Mã xác thực không đúng." });
    }

    // (Optional) Kiểm tra hết hạn
    if (sessionData.expireAt && sessionData.expireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "Mã xác thực đã hết hạn." });
    }

    // Gọi service reset password
    await resetPassword({ email: sessionData.email, newPassword });

    // Xóa session sau khi thành công
    delete req.session.verification;

    return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công!" });
  } catch (err) {
    console.error("❌ Lỗi reset password:", err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};
