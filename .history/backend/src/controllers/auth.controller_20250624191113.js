const { login } = require("../services/auth.service");
//=================Xử lý đăng nhập=======================
exports.loginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.status(200).json(result);
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


//===========================Xử lý kiểm tra email gửi mã xác thực=======================
// auth.controller.js
const nodemailer = require("nodemailer");

// ✅ THÊM dòng này
const verificationCodes = {}; // Bộ nhớ tạm lưu các mã xác thực đã gửi
exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Thiếu email" });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = code;

  console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Mã xác thực đăng ký",
    text: `Mã xác thực của bạn là: ${code}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Đã gửi:", info.response);
    res.status(200).json({ message: "Đã gửi mã xác thực" });
  } catch (error) {
    console.error("❌ Lỗi gửi email:", error);
    res.status(500).json({ message: "Lỗi khi gửi email. Kiểm tra cấu hình." });
  }
};
