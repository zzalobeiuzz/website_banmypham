import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
} from "recharts";
import useHttp from "../../../../../hooks/useHttp";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import "./stats.scss";

const COLORS = ["#4f46e5", "#0ea5a4", "#f97316", "#ef4444", "#a78bfa", "#60a5fa", "#34d399"];
const formatVND = (v) => new Intl.NumberFormat("vi-VN").format(v) + " đ";
const resolveProductImage = (image) => {
  const raw = String(image || "").trim();
  if (!raw) return `${UPLOAD_BASE}/pictures/no_image.jpg`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/uploads")) return `${API_BASE}${raw}`;
  return `${UPLOAD_BASE}/pictures/${raw}`;
};
const chartAnimation = {
  isAnimationActive: true,
  animationBegin: 120,
  animationDuration: 900,
  animationEasing: "ease-in-out",
};

const StatisticsPage = () => {
  const [range, setRange] = useState("month");
  const [data, setData] = useState({ categories: [], monthlyRaw: [], dailyRaw: [], weeklyRaw: [], quarterRaw: [], quarter: [], year: [], line: [], productSalesReport: [] });
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [defaultCategories, setDefaultCategories] = useState([]);
  const [defaultProductSalesReport, setDefaultProductSalesReport] = useState([]);
  const [hasLoadedStats, setHasLoadedStats] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [chartVersion, setChartVersion] = useState(0);
  const [reportCollapsed, setReportCollapsed] = useState(false);
  const [reportClosing, setReportClosing] = useState(false);
  const [chartMode, setChartMode] = useState("bar");
  const [timeFilterMode, setTimeFilterMode] = useState("year");
  const [yearFilterMode, setYearFilterMode] = useState("range");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { request, loading } = useHttp();

  // derive available years from an unfiltered call
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/admin/stats`);
        console.log(res.data)
        const payload = res.data || res;
        const yearsFromMonthly = Array.from(new Set((payload.monthlyRevenue || []).map((r) => (r.MonthLabel || "").slice(0, 4)))).filter(Boolean);
        const yearsFromQuarter = Array.from(new Set((payload.quarterlyRevenue || []).map((q) => String(q.YearLabel)))).filter(Boolean);
        const yearsFromDaily = Array.from(new Set((payload.dailyRevenue || []).map((d) => (d.DayLabel || "").slice(0, 4)))).filter(Boolean);
        const yearsFromWeekly = Array.from(new Set((payload.weeklyRevenue || []).map((w) => String(w.YearLabel)))).filter(Boolean);
        const years = Array.from(new Set([...yearsFromMonthly, ...yearsFromQuarter, ...yearsFromDaily, ...yearsFromWeekly])).filter(Boolean).sort();
        if (!mounted) return;
        setAvailableYears(years);
        if (!selectedYear && years.length) setSelectedYear(years[years.length - 1]);
        setYearFrom((prev)=>prev || years[Math.max(years.length - 5, 0)] || "");
        setYearTo((prev)=>prev || years[years.length - 1] || "");
        const days = (payload.dailyRevenue || []).map((d)=>d.DayLabel).filter(Boolean).sort();
        setDateFrom((prev)=>prev || days[0] || "");
        setDateTo((prev)=>prev || days[days.length - 1] || "");
      } catch (err) {
        console.error("Failed to load available years:", err?.message || err);
      }
    })();
    return () => { mounted = false; };
  }, [request, selectedYear]);

  // fetch filtered stats whenever range or selectedYear change
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (range) params.append("range", range);
        if (timeFilterMode === "dateRange") {
          if (dateFrom) params.append("fromDate", dateFrom);
          if (dateTo) params.append("toDate", dateTo);
        } else if (selectedYear && (range !== "year" || yearFilterMode === "single")) {
          params.append("year", selectedYear);
        }
        if (timeFilterMode !== "dateRange" && range === "year" && yearFilterMode === "range") {
          if (yearFrom) params.append("fromYear", yearFrom);
          if (yearTo) params.append("toYear", yearTo);
        }
        const url = `${API_BASE}/api/admin/stats` + (params.toString() ? `?${params.toString()}` : "");
        const res = await request("GET", url);
        console.log(res.data)
        const payload = res.data || res;

        const quarterRaw = (payload.quarterlyRevenue || []).map((q) => ({ year: String(q.YearLabel), quarter: Number(q.Quarter), revenue: Number(q.Revenue || 0) }));
        const dailyRaw = (payload.dailyRevenue || []).map((d) => ({ dayLabel: d.DayLabel, revenue: Number(d.Revenue || 0) }));
        const weeklyRaw = (payload.weeklyRevenue || []).map((w) => ({ year: String(w.YearLabel), week: Number(w.WeekOfYear), revenue: Number(w.Revenue || 0) }));

        const productSalesReport = (payload.productSalesReport || []).map((row) => ({
          productId: row.ProductID,
          productName: row.ProductName || "Sản phẩm",
          categoryName: row.CategoryName || "Khác",
          image: row.Image || "",
          quantity: Number(row.Quantity || 0),
          revenue: Number(row.Revenue || 0),
        }));

        const mapped = {
          categories: (payload.categoryRevenue || []).map((c) => ({ name: c.CategoryName || c.CategoryID, value: Number(c.Revenue || 0) })),
          monthlyRaw: (payload.monthlyRevenue || []).map((m) => ({ monthLabel: m.MonthLabel, revenue: Number(m.Revenue || 0) })),
          dailyRaw,
          weeklyRaw,
          quarterRaw,
          quarter: [1,2,3,4].map((qnum) => ({ label: `Quý ${qnum}`, revenue: quarterRaw.filter((r)=>r.quarter===qnum).reduce((s,r)=>s+r.revenue,0) })),
          year: (payload.yearlyRevenue || []).map((y) => ({ year: String(y.YearLabel), revenue: Number(y.Revenue || 0) })),
          line: (payload.monthlyRevenue || []).map((m) => ({ monthLabel: m.MonthLabel, revenue: Number(m.Revenue || 0) })),
          productSalesReport,
        };

        if (!mounted) return;
        setDefaultCategories(mapped.categories);
        setDefaultProductSalesReport(productSalesReport);
        setData(mapped);
        setChartVersion((prev)=>prev+1);
        setHasLoadedStats(true);
      } catch (err) {
        console.error("Failed to load stats:", err?.message || err);
        if (!mounted) return;
        setDefaultCategories([]);
        setDefaultProductSalesReport([]);
        setData({ categories: [], monthlyRaw: [], dailyRaw: [], weeklyRaw: [], quarterRaw: [], quarter: [], year: [], line: [], productSalesReport: [] });
        setChartVersion((prev)=>prev+1);
        setHasLoadedStats(true);
      }
    })();
    return () => { mounted = false; };
  }, [range, selectedYear, timeFilterMode, yearFilterMode, yearFrom, yearTo, dateFrom, dateTo, request]);

  // fetch only category revenue when a chart column is selected
  useEffect(() => {
    let mounted = true;

    if (!hasLoadedStats) {
      return () => { mounted = false; };
    }

    if (!selectedBucket) {
      setData((prev)=>({ ...prev, categories: defaultCategories, productSalesReport: defaultProductSalesReport }));
      return () => { mounted = false; };
    }

    (async () => {
      try {
        setCategoryLoading(true);
        const params = new URLSearchParams();
        if (range) params.append("range", range);
        if (timeFilterMode === "dateRange") {
          if (dateFrom) params.append("fromDate", dateFrom);
          if (dateTo) params.append("toDate", dateTo);
        } else if (selectedYear && (range !== "year" || yearFilterMode === "single")) {
          params.append("year", selectedYear);
        }
        if (timeFilterMode !== "dateRange" && range === "year" && yearFilterMode === "range") {
          if (yearFrom) params.append("fromYear", yearFrom);
          if (yearTo) params.append("toYear", yearTo);
        }
        params.append("categoryRange", selectedBucket.range);
        Object.entries(selectedBucket.params || {}).forEach(([key,value]) => {
          if (value !== undefined && value !== null && value !== "") params.append(key, value);
        });

        const url = `${API_BASE}/api/admin/stats` + (params.toString() ? `?${params.toString()}` : "");
        const res = await request("GET", url);
        const payload = res.data || res;
        const categories = (payload.categoryRevenue || []).map((c) => ({ name: c.CategoryName || c.CategoryID, value: Number(c.Revenue || 0) }));
        const productSalesReport = (payload.productSalesReport || []).map((row) => ({
          productId: row.ProductID,
          productName: row.ProductName || "Sản phẩm",
          categoryName: row.CategoryName || "Khác",
          image: row.Image || "",
          quantity: Number(row.Quantity || 0),
          revenue: Number(row.Revenue || 0),
        }));

        if (!mounted) return;
        setData((prev)=>({ ...prev, categories, productSalesReport }));
      } catch (err) {
        console.error("Failed to load category stats:", err?.message || err);
      } finally {
        if (mounted) setCategoryLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [defaultCategories, defaultProductSalesReport, hasLoadedStats, range, selectedBucket, selectedYear, timeFilterMode, yearFilterMode, yearFrom, yearTo, dateFrom, dateTo, request]);

  const donut = (data.categories || []).map((c) => ({ name: c.name, value: Number(c.value || 0), pct: 0 }));
  const total = donut.reduce((s,d)=>s+d.value,0);
  donut.forEach(d=>{ d.pct = total>0?Math.round((d.value/total)*100):0; });
  const sortedYearData = useMemo(() => (data.year || [])
    .slice()
    .sort((a,b)=>Number(a.year)-Number(b.year)), [data.year]);
  const yearChartData = useMemo(() => {
    if (timeFilterMode === "dateRange") return sortedYearData;

    if (yearFilterMode === "single") {
      const year = selectedYear || yearTo || sortedYearData[sortedYearData.length - 1]?.year;
      return sortedYearData.filter((item)=>String(item.year) === String(year));
    }

    const firstYear = sortedYearData[0]?.year;
    const lastYear = sortedYearData[sortedYearData.length - 1]?.year;
    const from = Number(yearFrom || firstYear);
    const to = Number(yearTo || lastYear);
    const min = Math.min(from, to);
    const max = Math.max(from, to);

    return sortedYearData.filter((item)=>{
      const year = Number(item.year);
      return year >= min && year <= max;
    });
  }, [selectedYear, sortedYearData, timeFilterMode, yearFilterMode, yearFrom, yearTo]);
  const selectedBucketLabel = selectedBucket?.label || "Tất cả";
  const chartAnimationKey = `${range}-${selectedYear || "all"}-${timeFilterMode}-${yearFilterMode}-${yearFrom}-${yearTo}-${dateFrom}-${dateTo}-${chartMode}-${chartVersion}`;
  const reportRows = data.productSalesReport || [];
  const reportTotalQuantity = reportRows.reduce((sum,row)=>sum + Number(row.quantity || 0), 0);
  const reportTotalRevenue = reportRows.reduce((sum,row)=>sum + Number(row.revenue || 0), 0);
  const formatDateLabel = (value) => {
    const parts = String(value || "").split("-");
    if (parts.length !== 3) return value || "";
    const [year, month, day] = parts;
    return `${Number(day)}/${Number(month)}/${year}`;
  };
  const reportRangeLabel = (() => {
    if (selectedBucket) {
      const params = selectedBucket.params || {};
      if (selectedBucket.range === "day") return `Ngày ${formatDateLabel(params.categoryDay)}`;
      if (selectedBucket.range === "week") return `Tuần ${params.categoryWeek} / ${params.categoryYear}`;
      if (selectedBucket.range === "month") return `Tháng ${params.categoryMonth} / ${params.categoryYear}`;
      if (selectedBucket.range === "quarter") return `Quý ${params.categoryQuarter} / ${params.categoryYear}`;
      if (selectedBucket.range === "year") return `Năm ${params.categoryYear}`;
      return selectedBucket.label || "Khoảng đã chọn";
    }

    if (timeFilterMode === "dateRange") {
      return dateFrom && dateTo ? `Từ ${formatDateLabel(dateFrom)} đến ${formatDateLabel(dateTo)}` : "Theo khoảng thời gian";
    }
    if (range === "day") return selectedYear ? `Theo ngày trong năm ${selectedYear}` : "Theo ngày";
    if (range === "week") return selectedYear ? `Theo tuần trong năm ${selectedYear}` : "Theo tuần";
    if (range === "month") return selectedYear ? `Theo tháng trong năm ${selectedYear}` : "Theo tháng";
    if (range === "quarter") return selectedYear ? `Theo quý trong năm ${selectedYear}` : "Theo quý";
    if (yearFilterMode === "single") return selectedYear ? `Năm ${selectedYear}` : "Theo năm";
    return yearFrom && yearTo ? `Từ năm ${yearFrom} đến ${yearTo}` : "Theo khoảng năm";
  })();

  const handleRangeChange = (value) => {
    setRange(value);
    setSelectedBucket(null);
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
    setSelectedBucket(null);
  };

  const handleTimeFilterModeChange = (value) => {
    setTimeFilterMode(value);
    setSelectedBucket(null);
  };

  const handleYearFilterModeChange = (value) => {
    setYearFilterMode(value);
    setSelectedBucket(null);
    if (value === "single" && !selectedYear && yearTo) setSelectedYear(yearTo);
  };

  const handleYearFromChange = (value) => {
    setYearFrom(value);
    setSelectedBucket(null);
  };

  const handleYearToChange = (value) => {
    setYearTo(value);
    setSelectedBucket(null);
  };

  const handleDateFromChange = (value) => {
    setDateFrom(value);
    setSelectedBucket(null);
  };

  const handleDateToChange = (value) => {
    setDateTo(value);
    setSelectedBucket(null);
  };

  const handleBarClick = (bucket) => {
    setSelectedBucket(bucket);
  };

  const handleCollapseReport = () => {
    setReportClosing(true);
    window.setTimeout(() => {
      setReportCollapsed(true);
      setReportClosing(false);
    }, 260);
  };

  const handleExpandReport = () => {
    setReportCollapsed(false);
    setReportClosing(false);
  };

  const renderRevenueChart = (rows, xKey, barKey, onClickBar) => {
    const renderLineDot = ({ cx, cy, payload }) => {
      if (cx === undefined || cy === undefined || !payload) return null;

      return (
        <g
          className="stats-line-point"
          onClick={()=>onClickBar({ payload })}
          role="button"
          tabIndex={0}
          onKeyDown={(event)=>{
            if (event.key === "Enter" || event.key === " ") onClickBar({ payload });
          }}
        >
          <circle className="stats-line-hit" cx={cx} cy={cy} r={11} />
          <circle className="stats-line-dot" cx={cx} cy={cy} r={4} />
        </g>
      );
    };

    return (
      <ComposedChart key={`chart-${chartAnimationKey}`} data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis tickFormatter={(v)=>v/1000+"k"} />
        <ReTooltip formatter={(v)=>[formatVND(v),'Doanh thu']} />
        {chartMode === "bar" && (
          <Bar
            key={`bar-${barKey}-${chartAnimationKey}`}
            dataKey="revenue"
            fill="#4f46e5"
            cursor="pointer"
            {...chartAnimation}
            onClick={onClickBar}
          />
        )}
        {chartMode === "line" && (
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#0ea5a4"
            strokeWidth={3}
            dot={renderLineDot}
            activeDot={renderLineDot}
            isAnimationActive
            animationDuration={650}
          />
        )}
      </ComposedChart>
    );
  };

  if (loading && !hasLoadedStats) return <div className="p-3">Đang tải thống kê...</div>;

  return (
    <div className="admin-stats-page p-3">
      <div className="stats-top row g-3">
        <div className="col-lg-6">
          <div className="card p-3 h-100">
            <div className="stats-revenue-head mb-2">
              <div className="stats-title-block">
                <h5 className="m-0">Doanh thu theo thời gian</h5>
                <div className="stats-primary-actions">
                  <div className="stats-chart-mode" role="group" aria-label="Kiểu biểu đồ">
                    <button
                      type="button"
                      className={chartMode === "bar" ? "active" : ""}
                      onClick={()=>setChartMode("bar")}
                    >
                      Cột
                    </button>
                    <button
                      type="button"
                      className={chartMode === "line" ? "active" : ""}
                      onClick={()=>setChartMode("line")}
                    >
                      Đường
                    </button>
                  </div>
                </div>
              </div>
              <div className="stats-controls">
                <select className="form-select" value={range} onChange={(e)=>handleRangeChange(e.target.value)}>
                  <option value="month">Theo tháng</option>
                  <option value="week">Theo tuần</option>
                  <option value="day">Theo ngày</option>
                  <option value="quarter">Theo quý</option>
                  <option value="year">Theo năm</option>
                </select>
                <div className={`stats-filter-mode ${timeFilterMode === "dateRange" ? "date-range-active" : ""}`}>
                  <select className="form-select" value={timeFilterMode} onChange={(e)=>handleTimeFilterModeChange(e.target.value)}>
                    <option value="year">Theo năm</option>
                    <option value="dateRange">Khoảng thời gian</option>
                  </select>
                  {timeFilterMode === "dateRange" && (
                    <div className="stats-date-range">
                      <input
                        type="date"
                        className="form-control"
                        value={dateFrom}
                        onChange={(e)=>handleDateFromChange(e.target.value)}
                      />
                      <input
                        type="date"
                        className="form-control"
                        value={dateTo}
                        onChange={(e)=>handleDateToChange(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                {timeFilterMode !== "dateRange" && (range === "month" || range === "quarter" || range === "week" || range === "day") && availableYears && availableYears.length > 0 && (
                  <div className="mt-2">
                    <select className="form-select" value={selectedYear||""} onChange={(e)=>handleYearChange(e.target.value)}>
                      {availableYears.map(y=> (<option key={y} value={y}>{y}</option>))}
                    </select>
                  </div>
                )}
                {timeFilterMode !== "dateRange" && range === "year" && availableYears && availableYears.length > 0 && (
                  <div className="stats-year-filter mt-2">
                    <select className="form-select" value={yearFilterMode} onChange={(e)=>handleYearFilterModeChange(e.target.value)}>
                      <option value="range">Khoảng năm</option>
                      <option value="single">Một năm</option>
                    </select>
                    {yearFilterMode === "single" ? (
                      <select className="form-select" value={selectedYear||""} onChange={(e)=>handleYearChange(e.target.value)}>
                        {availableYears.map(y=> (<option key={y} value={y}>{y}</option>))}
                      </select>
                    ) : (
                      <div className="stats-year-range">
                        <select className="form-select" value={yearFrom} onChange={(e)=>handleYearFromChange(e.target.value)}>
                          {availableYears.map(y=> (<option key={y} value={y}>{y}</option>))}
                        </select>
                        <select className="form-select" value={yearTo} onChange={(e)=>handleYearToChange(e.target.value)}>
                          {availableYears.map(y=> (<option key={y} value={y}>{y}</option>))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div key={`bar-frame-${chartAnimationKey}`} className="stats-chart-frame">
              <ResponsiveContainer>
                {(() => {
                  if (range === "day") {
                    const rows = (data.dailyRaw || [])
                      .filter(r=>timeFilterMode === "dateRange" || !selectedYear || String(r.dayLabel||"").startsWith(String(selectedYear)))
                      .sort((a,b)=>String(a.dayLabel||"").localeCompare(String(b.dayLabel||"")));
                    const visibleRows = timeFilterMode === "dateRange" ? rows : rows.slice(-60);
                    const bars = visibleRows.map(r=>({ day: r.dayLabel, revenue: r.revenue }));
                    return renderRevenueChart(bars, "day", "day", (entry)=>handleBarClick({
                      range: "day",
                      label: formatDateLabel(entry?.payload?.day),
                      params: { categoryDay: entry?.payload?.day },
                    }));
                  }

                  if (range === "week") {
                    const weekMap = new Map();
                    (data.weeklyRaw || [])
                      .filter(r=>timeFilterMode === "dateRange" || !selectedYear || String(r.year)===String(selectedYear))
                      .forEach((r)=>{
                        const week = Number(r.week);
                        const key = timeFilterMode === "dateRange" ? `${r.year}-${week}` : String(week);
                        weekMap.set(key, {
                          year: r.year,
                          week,
                          revenue: (weekMap.get(key)?.revenue || 0) + Number(r.revenue||0),
                        });
                      });
                    const list = Array.from(weekMap.values())
                      .sort((a,b)=>Number(a.year)-Number(b.year) || Number(a.week)-Number(b.week))
                      .map((item)=>({ label: timeFilterMode === "dateRange" ? `Tuần ${item.week}/${item.year}` : `Tuần ${item.week}`, year: item.year, week: item.week, revenue: item.revenue }));
                    return renderRevenueChart(list, "label", "week", (entry)=>handleBarClick({
                      range: "week",
                      label: `${entry?.payload?.label}${timeFilterMode === "dateRange" ? "" : ` / ${selectedYear}`}`,
                      params: {
                        categoryYear: entry?.payload?.year || selectedYear,
                        categoryWeek: entry?.payload?.week,
                      },
                    }));
                  }

                  if (range === "month") {
                    const year = selectedYear || (data.monthlyRaw[0] && data.monthlyRaw[0].monthLabel && data.monthlyRaw[0].monthLabel.slice(0,4));
                    if (timeFilterMode === "dateRange") {
                      const months = (data.monthlyRaw || [])
                        .slice()
                        .sort((a,b)=>String(a.monthLabel||"").localeCompare(String(b.monthLabel||"")))
                        .map((r)=>{
                          const monthLabel = r.monthLabel || "";
                          const rowYear = monthLabel.slice(0,4);
                          const monthNumber = Number(monthLabel.slice(5,7));
                          return {
                            month: `Tháng ${monthNumber}/${rowYear}`,
                            monthNumber,
                            year: rowYear,
                            revenue: Number(r.revenue || 0),
                          };
                        });

                      return renderRevenueChart(months, "month", "month", (entry)=>handleBarClick({
                        range: "month",
                        label: entry?.payload?.month,
                        params: {
                          categoryYear: entry?.payload?.year,
                          categoryMonth: entry?.payload?.monthNumber,
                        },
                      }));
                    }

                    const map = {};
                    (data.monthlyRaw || []).forEach((r)=>{
                      const ml = r.monthLabel || "";
                      if (ml.startsWith(year)) {
                        const m = Number(ml.slice(5,7));
                        map[m] = (map[m]||0) + Number(r.revenue||0);
                      }
                    });
                    const months = Array.from({length:12},(_,i)=>{ const m=i+1; return { month: `Tháng ${m}`, monthNumber: m, revenue: map[m]||0 }; });
                    return renderRevenueChart(months, "month", "month", (entry)=>handleBarClick({
                      range: "month",
                      label: `${entry?.payload?.month} / ${year}`,
                      params: {
                        categoryYear: year,
                        categoryMonth: entry?.payload?.monthNumber,
                      },
                    }));
                  }

                  if (range === "quarter" && (selectedYear || timeFilterMode === "dateRange")) {
                    if (timeFilterMode === "dateRange") {
                      const quarters = (data.quarterRaw || [])
                        .slice()
                        .sort((a,b)=>Number(a.year)-Number(b.year) || Number(a.quarter)-Number(b.quarter))
                        .map((row)=>({ label: `Quý ${row.quarter}/${row.year}`, year: row.year, quarter: row.quarter, revenue: row.revenue }));

                      return renderRevenueChart(quarters, "label", "quarter", (entry)=>handleBarClick({
                        range: "quarter",
                        label: entry?.payload?.label,
                        params: {
                          categoryYear: entry?.payload?.year,
                          categoryQuarter: entry?.payload?.quarter,
                        },
                      }));
                    }

                    const quarters = [1,2,3,4].map(qnum=>({ label: `Quý ${qnum}`, quarter: qnum, revenue: (data.quarterRaw||[]).filter(r=>String(r.year)===String(selectedYear) && r.quarter===qnum).reduce((s,r)=>s+r.revenue,0) }));
                    return renderRevenueChart(quarters, "label", "quarter", (entry)=>handleBarClick({
                      range: "quarter",
                      label: `${entry?.payload?.label} / ${selectedYear}`,
                      params: {
                        categoryYear: selectedYear,
                        categoryQuarter: entry?.payload?.quarter,
                      },
                    }));
                  }

                  const barData = range === "quarter" ? data.quarter : yearChartData;
                  const xKey = range === "quarter" ? "label" : "year";
                  return renderRevenueChart(barData, xKey, "year", (entry)=>handleBarClick({
                    range: "year",
                    label: `Năm ${entry?.payload?.year}`,
                    params: { categoryYear: entry?.payload?.year },
                  }));
                })()}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card p-3 h-100 stats-category-card">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="m-0">Tỷ lệ doanh thu theo danh mục</h5>
              <div className="small text-muted">Tổng: {formatVND((data.categories||[]).reduce((s,c)=>s+(c.value||0),0))}</div>
            </div>
            <div className="small text-muted mb-2">
              Đang xem: {selectedBucketLabel}
              {categoryLoading && <span className="ms-2">Đang cập nhật...</span>}
              {selectedBucket && (
                <button type="button" className="btn btn-link btn-sm p-0 ms-2" onClick={()=>setSelectedBucket(null)}>
                  Xem tất cả
                </button>
              )}
            </div>

            <div className="stats-category-chart">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donut} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry)=>`${entry.pct||0}%`}>
                    {(donut||[]).map((entry,idx)=>(<Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />))}
                  </Pie>
                  <ReTooltip formatter={(v)=>formatVND(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="legend stats-category-legend mt-2">
              {(donut||[]).map((d,idx)=>(
                <div className="legend-item" key={d.name}>
                  <span className="legend-color" style={{ background: COLORS[idx % COLORS.length] }} />
                  <span className="legend-name">{d.name}</span>
                  <span className="legend-pct">{d.pct||0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {reportCollapsed && (
        <button
          type="button"
          className="stats-report-collapsed-tab"
          onClick={handleExpandReport}
        >
          Chi tiết doanh thu
        </button>
      )}

      {!reportCollapsed && (
        <div className={`stats-report mt-3 ${reportClosing ? "is-closing" : ""}`}>
          <div className="card p-3 stats-report-card">
            <div className="stats-report-head">
              <div>
                <h5 className="m-0">Báo cáo doanh thu chi tiết</h5>
                <div className="text-muted small">{reportRangeLabel}</div>
              </div>
              <div className="stats-report-summary">
                <div>
                  <span>Số lượng bán ra</span>
                  <strong>{new Intl.NumberFormat("vi-VN").format(reportTotalQuantity)}</strong>
                </div>
                <div>
                  <span>Doanh thu</span>
                  <strong>{formatVND(reportTotalRevenue)}</strong>
                </div>
              </div>
              <button
                type="button"
                className="stats-report-minimize"
                onClick={handleCollapseReport}
                aria-label="Thu nhỏ báo cáo chi tiết"
                title="Thu nhỏ"
              >
                -
              </button>
            </div>

            <div className="stats-report-table">
              <div className="stats-report-row header">
                <span>STT</span>
                <span>Ảnh</span>
                <span>Mã sản phẩm</span>
                <span>Sản phẩm</span>
                <span>Danh mục</span>
                <span>Số lượng</span>
                <span>Doanh thu</span>
              </div>
              {reportRows.length === 0 ? (
                <div className="stats-report-empty">Chưa có dữ liệu bán hàng trong khoảng thời gian này.</div>
              ) : (
                reportRows.map((row,index)=>(
                  <div className="stats-report-row" key={`${row.productId || row.productName}-${index}`}>
                    <span>{index + 1}</span>
                    <span className="stats-report-thumb">
                      <img
                        src={resolveProductImage(row.image)}
                        alt={row.productName}
                        onError={(event)=>{
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
                        }}
                      />
                    </span>
                    <span>{row.productId || "-"}</span>
                    <strong title={row.productName}>{row.productName}</strong>
                    <span title={row.categoryName}>{row.categoryName}</span>
                    <span>{new Intl.NumberFormat("vi-VN").format(row.quantity)}</span>
                    <span>{formatVND(row.revenue)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
