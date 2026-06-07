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

exports.handleGetUnavailableProductSales = async (req, res) => {
  try {
    const data = await saleEventService.getUnavailableProductSales({
      startDate: req.query.start_date || req.query.startDate,
      endDate: req.query.end_date || req.query.endDate,
      excludeSaleEventId: req.query.excludeSaleEventId || req.query.exclude_sale_event_id,
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("❌ Lỗi handleGetUnavailableProductSales:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Không thể tải danh sách sản phẩm đang sale.",
    });
  }
};

exports.handleGetSaleEventDetail = async (req, res) => {
  try {
    const data = await saleEventService.getSaleEventDetail(req.params.id);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("❌ Lỗi handleGetSaleEventDetail:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Không thể tải chi tiết sự kiện giảm giá.",
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

exports.handleUpdateSaleEvent = async (req, res) => {
  try {
    const row = await saleEventService.updateSaleEvent({
      id: req.params.id,
      body: req.body,
      file: req.file,
    });
    return res.json({
      success: true,
      message: "Cập nhật sự kiện giảm giá thành công.",
      data: row,
    });
  } catch (error) {
    console.error("❌ Lỗi handleUpdateSaleEvent:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Không thể cập nhật sự kiện giảm giá.",
    });
  }
};

exports.handleDeleteSaleEvent = async (req, res) => {
  try {
    const data = await saleEventService.deleteSaleEvent(req.params.id);
    return res.json({
      success: true,
      message: "Xóa sự kiện giảm giá thành công.",
      data,
    });
  } catch (error) {
    console.error("❌ Lỗi handleDeleteSaleEvent:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Không thể xóa sự kiện giảm giá.",
    });
  }
};
