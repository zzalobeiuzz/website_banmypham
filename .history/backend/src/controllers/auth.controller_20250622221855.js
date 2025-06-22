
// ============================= NHẬN DỮ LIỆU FORM ĐĂNG NHẬP ĐƯỢC GỬI LÊN TỪ CLIENT==================
exports.loginHandler = async (req, res) => {
    try {
        const {email , password} = req.body;
        const result = await login(email, password); // gọi service
        res.status(200).json(products);
      } catch (err) {
        console.error("❌ Lỗi khi lấy sale products:", err.message);   // <-- in thông báo lỗi
        console.error("❌ Stack trace:", err.stack);                    // <-- in vết lỗi đầy đủ
        res.status(500).json({ message: "Lỗi server khi lấy sản phẩm khuyến mãi." });
      }
  };
  