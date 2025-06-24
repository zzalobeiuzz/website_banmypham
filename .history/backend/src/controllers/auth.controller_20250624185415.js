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
// controllers/auth.controller.js
const nodemailer = require("nodemailer");

const verificationCodes = {}; // Tạm thời lưu mã xác thực

exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Thiếu email" });

  // ✅ Tạo mã xác thực ngẫu nhiên
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = code;

  // ✅ Cấu hình tài khoản gửi Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // mật khẩu ứng dụng (app password)
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Mã xác thực đăng ký",
    text: `Mã xác thực của bạn là: ${code}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Gửi mã xác thực thành công đến", email);
    res.status(200).json({ message: "Đã gửi mã xác thực" });
  } catch (error) {
    console.error("❌ Lỗi gửi email:", error.message);
    res.status(500).json({ message: "Gửi email thất bại" });
  }
};

// Cho các file khác truy cập verificationCodes nếu cần
exports.verificationCodes = verificationCodes;
