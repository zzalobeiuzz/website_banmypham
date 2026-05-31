const { getAllVouchers: getAllVouchersService } = require("./voucher.service");
const { createVoucher: createVoucherService } = require("./voucher.service");
const { updateVoucher: updateVoucherService } = require("./voucher.service");
const { deleteVoucher: deleteVoucherService } = require("./voucher.service");

async function handleGetVouchers(req, res) {
  try {
    const result = await getAllVouchersService();

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi handleGetVouchers:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách voucher",
    });
  }
}

module.exports = {
  handleGetVouchers,
  handleCreateVoucher: async function handleCreateVoucher(req, res) {
    try {
      const payload = req.body || {};
      const result = await createVoucherService(payload);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error("❌ Lỗi handleCreateVoucher:", error.message);
      return res.status(500).json({ success: false, message: "Lỗi server khi tạo voucher" });
    }
  },
  handleUpdateVoucher: async function handleUpdateVoucher(req, res) {
    try {
      const identifier = req.params.id;
      const payload = req.body || {};
      const result = await updateVoucherService(identifier, payload);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("❌ Lỗi handleUpdateVoucher:", error.message);
      return res.status(500).json({ success: false, message: "Lỗi server khi cập nhật voucher" });
    }
  },
  handleDeleteVoucher: async function handleDeleteVoucher(req, res) {
    try {
      const identifier = req.params.id;
      const result = await deleteVoucherService(identifier);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("❌ Lỗi handleDeleteVoucher:", error.message);
      return res.status(500).json({ success: false, message: "Lỗi server khi xóa voucher" });
    }
  },
};