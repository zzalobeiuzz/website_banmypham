const voucherModel = require("./voucher.model");

exports.getAllVouchers = async () => {
  try {
    const data = await voucherModel.getAllVouchers();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("❌ Lỗi getAllVouchers:", error.message);
    return {
      success: false,
      message: error.message || "Không thể tải danh sách voucher.",
    };
  }
};

exports.createVoucher = async (payload) => {
  try {
    const row = await voucherModel.createVoucher(payload);

    return {
      success: true,
      data: row,
    };
  } catch (error) {
    console.error("❌ Lỗi createVoucher:", error.message);
    return {
      success: false,
      message: error.message || "Không thể tạo voucher.",
    };
  }
};

exports.updateVoucher = async (identifier, payload) => {
  try {
    const row = await voucherModel.updateVoucher(identifier, payload);

    return {
      success: true,
      data: row,
    };
  } catch (error) {
    console.error("❌ Lỗi updateVoucher:", error.message);
    return {
      success: false,
      message: error.message || "Không thể cập nhật voucher.",
    };
  }
};

exports.deleteVoucher = async (identifier) => {
  try {
    const result = await voucherModel.deleteVoucher(identifier);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ Lỗi deleteVoucher:", error.message);
    return {
      success: false,
      message: error.message || "Không thể xóa voucher.",
    };
  }
};
