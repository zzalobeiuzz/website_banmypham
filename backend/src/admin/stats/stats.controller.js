const statsService = require("./stats.service");

exports.handleGetStats = async (req, res) => {
  try {
    // Nhận các tham số lọc doanh thu từ frontend:
    // range/year/fromDate/toDate cho biểu đồ chính,
    // category* cho biểu đồ tròn và bảng chi tiết khi bấm vào một cột.
    const { range, year, fromYear, toYear, fromDate, toDate, categoryRange, categoryYear, categoryMonth, categoryWeek, categoryDay, categoryQuarter } = req.query || {};

    // Service sẽ tự dựng điều kiện SQL và tổng hợp doanh thu theo năm/quý/tháng/ngày.
    const stats = await statsService.getAggregatedStats({
      range,
      year,
      fromYear,
      toYear,
      fromDate,
      toDate,
      categoryRange,
      categoryYear,
      categoryMonth,
      categoryWeek,
      categoryDay,
      categoryQuarter,
    });
    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error("❌ Lỗi lấy thống kê:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy thống kê" });
  }
};

exports.handleGetOverview = async (req, res) => {
  try {
    const overview = await statsService.getOverviewStats();
    return res.json({ success: true, data: overview });
  } catch (err) {
    console.error("❌ Lỗi lấy tổng quan admin:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy tổng quan admin" });
  }
};
