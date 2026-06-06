const { getHomeBannerEvents, getEventProducts, getActivePromotionPrograms } = require("../services/event.service");

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

exports.getEventProductsHandler = async (req, res) => {
  try {
    const data = await getEventProducts(req.params.id);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy sản phẩm sự kiện:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy sản phẩm sự kiện.",
    });
  }
};

exports.getActivePromotionProgramsHandler = async (req, res) => {
  try {
    const productLimit = req.query.productLimit || req.query.product_limit;
    const events = await getActivePromotionPrograms({ productLimit });
    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy chương trình khuyến mãi:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chương trình khuyến mãi.",
    });
  }
};
