const nodemailer = require("nodemailer");

exports.sendVerificationEmail = async (email, code, use) => {
  const subject =
    use === "register"
      ? "Mã xác thực đăng ký"
      : "Mã xác thực khôi phục mật khẩu";

  const text = `Mã xác thực của bạn là: ${code}`;

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
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};
