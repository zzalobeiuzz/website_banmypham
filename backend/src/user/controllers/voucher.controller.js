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

exports.validateVoucherCodeHandler = async (req, res) => {
  try {
    const code = req.query.code || req.body?.code || "";
    const subtotal = req.query.subtotal ?? req.body?.subtotal ?? 0;
    const result = await validateVoucherCode(code, subtotal);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra voucher:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra mã giảm giá.",
    });
  }
};