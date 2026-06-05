const { getHomeBannerEvents } = require("../services/event.service");

exports.getHomeBannerEventsHandler = async (req, res) => {
  try {
    const events = await getHomeBannerEvents();
    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy banner sự kiện trang chủ:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy banner sự kiện trang chủ.",
    });
  }
};
