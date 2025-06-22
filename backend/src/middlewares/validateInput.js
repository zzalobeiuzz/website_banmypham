// middlewares/validateInput.js
const validateLoginInput = (req, res, next) => {
    const { email, password } = req.body;

    // Kiểm tra tồn tại
    if (!email || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mật khẩu." });
    }

    // Biểu thức kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /*
    Giải thích biểu thức:
    
    ^               // Bắt đầu chuỗi
    
    [^\s@]+         // 1 hoặc nhiều ký tự KHÔNG PHẢI khoảng trắng (\s) và KHÔNG PHẢI ký tự '@'
                     -> Đây là phần username trước dấu @ (ví dụ: abc trong abc@gmail.com)
    
    @               // Dấu '@' bắt buộc
    
    [^\s@]+         // 1 hoặc nhiều ký tự KHÔNG PHẢI khoảng trắng và KHÔNG PHẢI '@'
                     -> Đây là phần tên miền (ví dụ: gmail)
    
    \.              // Dấu chấm '.' phân cách tên miền và phần mở rộng
    
    [^\s@]+         // 1 hoặc nhiều ký tự KHÔNG PHẢI khoảng trắng và '@'
                     -> Đây là phần mở rộng tên miền (ví dụ: com, vn)
    
    $               // Kết thúc chuỗi
    */

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email không hợp lệ." });
    }

    // Nếu hợp lệ → tiếp tục
    next();
};

module.exports = validateLoginInput;
