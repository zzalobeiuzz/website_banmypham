const saleEventService = require("./saleEvent.service");

exports.handleGetSaleEvents = async (req, res) => {
  try {
    const data = await saleEventService.getAllSaleEvents();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("❌ Lỗi handleGetSaleEvents:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Không thể tải danh sách sự kiện giảm giá.",
    });
  }
};

exports.handleCreateSaleEvent = async (req, res) => {
  try {
    const row = await saleEventService.createSaleEvent({ body: req.body, file: req.file });
    return res.status(201).json({
      success: true,
      message: "Tạo sự kiện giảm giá thành công.",
      data: row,
    });
  } catch (error) {
    console.error("❌ Lỗi handleCreateSaleEvent:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Không thể tạo sự kiện giảm giá.",
    });
  }
};