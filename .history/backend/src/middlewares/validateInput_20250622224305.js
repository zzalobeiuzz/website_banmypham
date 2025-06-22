// middlewares/validateInput.js
const validateLoginInput = (req, res, next) => {
    const { email, password } = req.body;
  
    // Kiểm tra tồn tại
    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mật khẩu." });
    }
  
    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ." });
    }
  
    // Nếu hợp lệ → tiếp tục
    next();
  };
  
  module.exports = validateLoginInput;
  