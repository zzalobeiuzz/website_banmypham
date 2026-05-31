const adminVoucherModel = require("../../admin/voucher/voucher.model");

const normalizeCode = (value) => String(value || "").trim().toUpperCase();

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isPublicVoucher = (voucher) => {
  const active = Number(voucher?.IsActive) === 1 || String(voucher?.IsActive).toLowerCase() === "true";
  const isPublic = String(voucher?.IsPublic ?? "private").toLowerCase() === "public";
  return active && isPublic;
};

const isVoucherInDateRange = (voucher) => {
  const now = new Date();
  const startDate = toDateOrNull(voucher?.StartDate);
  const endDate = toDateOrNull(voucher?.EndDate);

  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;
  return true;
};

exports.getPublicVouchers = async () => {
  const vouchers = await adminVoucherModel.getAllVouchers();

  return (Array.isArray(vouchers) ? vouchers : [])
    .filter(isPublicVoucher)
    .map((voucher) => ({
      id: voucher.VoucherID ?? voucher.VoucherId ?? voucher.ID ?? voucher.VoucherCode,
      title: voucher.Title || voucher.VoucherCode || "",
      detail: voucher.Detail || "",
      code: voucher.VoucherCode || "",
      progress: Number(voucher.ProgressPct ?? voucher.Progress ?? 0),
      claimedCount: Number(voucher.ClaimedCount || 0),
      totalQuota: voucher.TotalQuota == null ? null : Number(voucher.TotalQuota),
      startDate: voucher.StartDate || null,
      endDate: voucher.EndDate || null,
      discountAmount: Number(voucher.DiscountAmount || 0),
      minOrderAmount: Number(voucher.MinOrderAmount || 0),
      isActive: voucher.IsActive,
      isPublic: voucher.IsPublic,
    }));
};

exports.validateVoucherCode = async (code, subtotal = 0) => {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    return {
      success: false,
      message: "Vui lòng nhập mã giảm giá.",
    };
  }

  const vouchers = await exports.getPublicVouchers();
  const matchedVoucher = (Array.isArray(vouchers) ? vouchers : []).find(
    (voucher) => normalizeCode(voucher.code) === normalizedCode,
  );

  if (!matchedVoucher) {
    return {
      success: false,
      message: "Mã giảm giá không hợp lệ.",
    };
  }

  if (!isVoucherInDateRange(matchedVoucher)) {
    return {
      success: false,
      message: "Mã giảm giá đã hết hạn hoặc chưa đến ngày áp dụng.",
    };
  }

  const minimumOrder = Number(matchedVoucher.minOrderAmount || 0) || 0;
  const orderSubtotal = Number(subtotal || 0) || 0;
  if (orderSubtotal < minimumOrder) {
    return {
      success: false,
      message: `Đơn hàng tối thiểu ${minimumOrder.toLocaleString("vi-VN")}đ để dùng mã này.`,
    };
  }

  const discountAmount = Math.max(0, Number(matchedVoucher.discountAmount || 0) || 0);
  const appliedDiscount = Math.min(discountAmount, orderSubtotal);

  return {
    success: true,
    message: "Áp dụng mã giảm giá thành công.",
    data: {
      code: matchedVoucher.code,
      title: matchedVoucher.title,
      discountAmount: appliedDiscount,
      originalDiscountAmount: discountAmount,
      minOrderAmount: minimumOrder,
      subtotal: orderSubtotal,
      total: Math.max(0, orderSubtotal - appliedDiscount),
    },
  };
};