const { login, checkEmailAndGenerateCode,register } = require("../services/auth.service");
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
//===========================Xử lý kiểm tra email gửi mã=======================
// auth.controller.js
const nodemailer = require("nodemailer");
const verificationCodes = {}; // Bộ nhớ tạm lưu các mã xác thực đã gửi


exports.sendVerificationCode = async (req, res) => {
  const { email, use } = req.body;

  if (!email || !use) {
    return res.status(400).json({
      success: false,
      message: "Thiếu email hoặc mục đích (use)",
    });
  }

  try {
    const result = await checkEmailAndGenerateCode(email, use);

    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: result.message,
      });
    }

    const code = result.code;
    verificationCodes[email] = code;

    // ✅ Phản hồi ngay cho client
    res.status(200).json({
      success: true,
      code, // chỉ gửi khi đang DEV/test
      message: "✅ Mã xác thực đã được tạo. Đang gửi email...",
    });

    // 📤 Gửi email sau response
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✉️ Tuỳ theo mục đích
    const subject =
      use === "register"
        ? "Mã xác thực đăng ký"
        : use === "forgot"
        ? "Mã xác thực khôi phục mật khẩu"
        : "Mã xác thực";

    const text = `Mã xác thực của bạn là: ${code}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Đã gửi mã xác thực (${use}) đến:`, email);
  } catch (err) {
    console.error("❌ Lỗi khi xử lý gửi mã:", err.message);
    // Không được res.json ở đây vì đã gửi response phía trên
  }
};


