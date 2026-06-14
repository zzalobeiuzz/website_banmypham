const supportRequestModel = require("./supportRequest.model");

exports.createSupportRequest = async (req, res) => {
  try {
    const data = await supportRequestModel.createSupportRequest(req.body || {});
    return res.status(201).json({
      success: true,
      message: "Đã gửi yêu cầu hỗ trợ.",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Không thể gửi yêu cầu hỗ trợ.",
    });
  }
};

exports.listSupportRequests = async (req, res) => {
  try {
    const unreadOnly = String(req.query.unreadOnly || "") === "1";
    const limit = Number(req.query.limit || 30);
    const [items, unreadCount] = await Promise.all([
      supportRequestModel.listSupportRequests({ unreadOnly, limit }),
      supportRequestModel.getUnreadSupportRequestCount(),
    ]);

    return res.json({
      success: true,
      data: items,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể tải yêu cầu hỗ trợ.",
    });
  }
};

exports.markSupportRequestRead = async (req, res) => {
  try {
    const data = await supportRequestModel.markSupportRequestRead(req.params.id);
    const unreadCount = await supportRequestModel.getUnreadSupportRequestCount();

    return res.json({
      success: true,
      data,
      unreadCount,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || "Không thể đánh dấu đã đọc.",
    });
  }
};
