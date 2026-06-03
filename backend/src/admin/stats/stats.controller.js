const statsService = require("./stats.service");

exports.handleGetStats = async (req, res) => {
  try {
    const { range, year, fromYear, toYear, fromDate, toDate, categoryRange, categoryYear, categoryMonth, categoryWeek, categoryDay, categoryQuarter } = req.query || {};
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
