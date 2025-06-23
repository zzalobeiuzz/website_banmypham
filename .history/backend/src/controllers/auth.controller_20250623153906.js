const { login } = require("../services/auth.service")
// ============================= NHẬN DỮ LIỆU FORM ĐĂNG NHẬP ĐƯỢC GỬI LÊN TỪ CLIENT==================
exports.loginHandler = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email,password);
        const result = await login(email, password); // gọi service
        res.status(200).json(result);
    } catch (err) {
        console.error("❌ Lỗi khi đăng nhập:", err.message);
        res.status(500).json({ message: "Lỗi server khi đăng nhập." });
    }
};
