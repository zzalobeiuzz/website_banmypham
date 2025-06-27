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
    
    // ❌ Nếu lỗi (email đã tồn tại với register, hoặc chưa tồn tại với forgot)
    if (!result.success) {
      console.log("❌ Không gửi email vì điều kiện không đạt:", result.message);
      return res.status(200).json({
        success: false,
        message: result.message,
      });
    }
    
    const code = result.code;
    verificationCodes[email] = code;

    // ✅ Trả về phản hồi ngay
    if (use === "register") {
      res.status(200).json({
        success: true,
        code, // 👈 Có thể ẩn trong production
        message: "✅ Mã xác thực đã được tạo. Đang gửi email...",
      });
    } else if (use === "forgot") {
      res.status(200).json({
        success: true,
        message: "📧 Mã khôi phục đã được gửi đến email của bạn!",
      });
    }

    // 📤 Gửi email SAU khi response
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const subject =
      use === "register"
        ? "Mã xác thực đăng ký"
        : "Mã xác thực khôi phục mật khẩu";

    const text = `Mã xác thực của bạn là: ${code}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Đã gửi mã xác thực (${use}) đến: ${email}`);
  } catch (err) {
    console.error("❌ Lỗi khi gửi mã xác thực:", err.message);
    // Không được res.json tại đây vì response đã được gửi trước đó
  }
};

