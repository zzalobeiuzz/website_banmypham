// middlewares/validateInput.js
const validateLoginInput = (req, res, next) => {
    const { email, password } = req.body;
    console.log(email)
    // Kiểm tra tồn tại
    if (!email || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mật khẩu." });
    }

    // Biểu thức kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email không hợp lệ." });
    }

    // Nếu hợp lệ → tiếp tục
    next();
};

module.exports = validateLoginInput;
// ✅ Export theo tên
exports.validateLoginInput = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mật khẩu." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email không hợp lệ." });
    }

    next();
};
