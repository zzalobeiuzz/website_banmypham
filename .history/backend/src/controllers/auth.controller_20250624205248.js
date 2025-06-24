const { login,checkEmailAndGenerateCode  } = require("../services/auth.service");
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
const verificationCodes = {}; // Bộ nhớ tạm lưu các mã xác thực đã gửi

exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Thiếu email" });

  try {
    const code = await checkEmailAndGenerateCode(email);
    verificationCodes[email] = code;

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

    await transporter.sendMail(mailOptions);
    console.log("✅ Gửi mã xác thực thành công đến:", email);
    res.status(200).json({
      success: true,
      message: "Đã gửi mã xác thực",
      // code: code, // Nếu bạn muốn gửi về cả mã (debug/test)
    });
    
  } catch (err) {
    if (err.message === "Email đã được sử dụng") {
      return res.status(409).json({ message: err.message });
    }
    console.error("❌ Lỗi gửi email:", err.message);
    res.status(500).json({ message: "Lỗi server khi gửi mã xác thực" });
  }
};
