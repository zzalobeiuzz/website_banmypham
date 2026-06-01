const { getPublicVouchers, validateVoucherCode } = require("../services/voucher.service");

exports.getPublicVouchersHandler = async (req, res) => {
  try {
    const vouchers = await getPublicVouchers();

    return res.status(200).json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy voucher public:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách voucher.",
    });
  }
};

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

exports.validateVoucherCodeHandler = async (req, res) => {
  try {
    const code = req.query.code || req.body?.code || "";
    const subtotal = req.query.subtotal ?? req.body?.subtotal ?? 0;

    // Nếu client gửi Authorization Bearer token, giải mã để lấy userId
    let userId = null;
    try {
      const authHeader = String(req.headers?.authorization || "").trim();
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.id || decoded?.email || decoded?.userId || null;
      }
    } catch (ignore) {
      // Nếu token không hợp lệ thì bỏ qua — validation voucher vẫn được chạy như guest
    }

    const result = await validateVoucherCode(code, subtotal, userId);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra voucher:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra mã giảm giá.",
    });
  }
};