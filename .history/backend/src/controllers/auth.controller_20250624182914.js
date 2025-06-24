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
const nodemailer = require("nodemailer");

const verificationCodes = {};

exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Thiếu email" });

  // Tạo mã
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = code;

  // Cấu hình SMTP (dùng Gmail demo)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "yourgmail@gmail.com",
      pass: "your-app-password", // dùng mật khẩu ứng dụng, không dùng mật khẩu thật
    },
  });

  const mailOptions = {
    from: "yourgmail@gmail.com",
    to: email,
    subject: "Mã xác thực đăng ký",
    text: `Mã xác thực của bạn là: ${code}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email đã gửi:", info.response);
    return res.status(200).json({ message: "Đã gửi mã xác thực", code }); // không nên trả về code thật
  } catch (error) {
    console.error("❌ Lỗi gửi email:", error.message);
    return res.status(400).json({ message: "Email không hợp lệ hoặc không tồn tại" });
  }
};
