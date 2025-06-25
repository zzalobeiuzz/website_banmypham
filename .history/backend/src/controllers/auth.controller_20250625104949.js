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
//=========================== Đăng kí mới người dùng ==============================
exports.registerHandler = async (req,res) =>{
  const result = await regis
}
//===========================Xử lý kiểm tra email gửi mã xác thực=======================
// auth.controller.js
const nodemailer = require("nodemailer");
const verificationCodes = {}; // Bộ nhớ tạm lưu các mã xác thực đã gửi


exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Thiếu email",
    });
  }

  try {
    const result = await checkEmailAndGenerateCode(email);

    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: result.message,
      });
    }

    const code = result.code;
    verificationCodes[email] = code;

    // ✅ Trả kết quả NGAY cho client
    res.status(200).json({
      success: true,
      code, // optional: chỉ test/dev mới nên gửi về
      message: "✅ Mã xác thực đã được tạo. Đang gửi email...",
    });

    // 📤 Gửi email SAU KHI ĐÃ response → không làm chậm client
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
    console.log("✅ Đã gửi mã xác thực đến:", email);

  } catch (err) {
    console.error("❌ Lỗi khi xử lý:", err.message);
    // Không thể res.json ở đây nữa vì đã gửi response trước đó
    // Có thể log lỗi hoặc lưu log lại
  }
};



