import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Customized,
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
  // Trạng thái chính của biểu đồ doanh thu: range là cấp đang chọn ở dropdown,
  // drillLevel là cấp đang xem sau khi người dùng bấm vào cột biểu đồ.
  const [range, setRange] = useState("month");
  const [data, setData] = useState({ categories: [], monthlyRaw: [], dailyRaw: [], quarterRaw: [], quarter: [], year: [], line: [], productSalesReport: [] });
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [defaultCategories, setDefaultCategories] = useState([]);
  const [defaultProductSalesReport, setDefaultProductSalesReport] = useState([]);
  const [hasLoadedStats, setHasLoadedStats] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [chartVersion, setChartVersion] = useState(0);
  const [reportCollapsed, setReportCollapsed] = useState(false);
  const [reportClosing, setReportClosing] = useState(false);
  const [chartMode, setChartMode] = useState("bar");
  const currentYear = String(new Date().getFullYear());
  const [activeYear, setActiveYear] = useState(currentYear);
  const [dataYear, setDataYear] = useState(currentYear);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [drillLevel, setDrillLevel] = useState("month");
  const [selectedMonthDrill, setSelectedMonthDrill] = useState(null);
  const [selectedDayDrill, setSelectedDayDrill] = useState(null);
  const [selectedQuarterDrill, setSelectedQuarterDrill] = useState(null);
  const [selectedYearDrill, setSelectedYearDrill] = useState(null);
  const { request, loading } = useHttp();
  const hasActiveDateRange = Boolean(dateFrom && dateTo);

  // Xác định năm cần tải doanh thu. Ưu tiên mốc đang drill để khi chuyển
  // quý/tháng/ngày sang năm khác thì API luôn lấy đúng dữ liệu của năm đó.
  const drillYear =
    (selectedDayDrill?.day || "").slice(0, 4) ||
    (drillLevel === "day" ? selectedMonthDrill?.year : "") ||
    selectedQuarterDrill?.year ||
    selectedMonthDrill?.year ||
    selectedYearDrill?.year ||
    "";
  const statsYear = String(drillYear || dataYear || activeYear);

  // Range gửi lên backend có thể khác dropdown. Ví dụ đang click quý thì
  // frontend cần dữ liệu tháng trong quý đó, nên gửi range=month.
  const statsQueryRange = (() => {
    if (selectedDayDrill) return "day";
    if (drillLevel === "day" && selectedMonthDrill) return "day";
    if (selectedQuarterDrill) return "month";
    if (range === "year" && selectedYearDrill) return "quarter";
    return range;
  })();
  const statsRequestSeq = useRef(0);

  // Đồng bộ năm dữ liệu khi state drill đổi năm, tránh trường hợp UI hiển thị
  // năm mới nhưng request vẫn dùng năm cũ.
  useEffect(() => {
    if (!hasActiveDateRange && drillYear && drillYear !== dataYear) {
      setDataYear(String(drillYear));
    }
  }, [dataYear, drillYear, hasActiveDateRange]);

  useEffect(() => {
    if (!["month", "day"].includes(drillLevel)) {
      setDrillLevel("day");
    }
  }, [drillLevel]);

  useEffect(() => {
    if (!["month", "quarter", "year"].includes(range)) {
      setRange("month");
      setDrillLevel("month");
      setSelectedMonthDrill(null);
      setSelectedDayDrill(null);
      setSelectedQuarterDrill(null);
      setSelectedYearDrill(null);
    }
  }, [range]);

  // Tải toàn bộ dữ liệu doanh thu cho biểu đồ chính, biểu đồ tròn và bảng chi tiết.
  useEffect(() => {
    let mounted = true;
    const requestId = ++statsRequestSeq.current;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (statsQueryRange) params.append("range", statsQueryRange);
        if (hasActiveDateRange) {
          params.append("fromDate", dateFrom);
          params.append("toDate", dateTo);
        } else {
          params.append("year", statsYear);
        }
        params.append("_", `${statsYear}-${statsQueryRange}-${requestId}`);
        const url = `${API_BASE}/api/admin/stats` + (params.toString() ? `?${params.toString()}` : "");
        console.debug("stats request", { url, statsYear, statsQueryRange });
        const res = await request("GET", url);
        const payload = res.data || res;

        // Chuẩn hóa dữ liệu doanh thu từ backend về định dạng frontend dùng cho Recharts.
        const quarterRaw = (payload.quarterlyRevenue || []).map((q) => ({ year: String(q.YearLabel), quarter: Number(q.Quarter), revenue: Number(q.Revenue || 0) }));
        const dailyRaw = (payload.dailyRevenue || []).map((d) => ({ dayLabel: d.DayLabel, revenue: Number(d.Revenue || 0) }));
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
          quarterRaw,
          quarter: [1,2,3,4].map((qnum) => ({ label: `Quý ${qnum}`, revenue: quarterRaw.filter((r)=>r.quarter===qnum).reduce((s,r)=>s+r.revenue,0) })),
          year: (payload.yearlyRevenue || []).map((y) => ({ year: String(y.YearLabel), revenue: Number(y.Revenue || 0) })),
          line: (payload.monthlyRevenue || []).map((m) => ({ monthLabel: m.MonthLabel, revenue: Number(m.Revenue || 0) })),
          productSalesReport,
        };
        console.debug("stats response", {
          statsYear,
          statsQueryRange,
          monthly: mapped.monthlyRaw.length,
          daily: mapped.dailyRaw.length,
          quarterly: mapped.quarterRaw.length,
          yearly: mapped.year.length,
        });

        // Bỏ qua response cũ nếu người dùng đổi mốc thời gian liên tục.
        if (!mounted || requestId !== statsRequestSeq.current) return;
        setDefaultCategories(mapped.categories);
        setDefaultProductSalesReport(productSalesReport);
        setData(mapped);
        setChartVersion((prev)=>prev+1);
        setHasLoadedStats(true);
      } catch (err) {
        console.error("Failed to load stats:", err?.message || err);
        if (!mounted || requestId !== statsRequestSeq.current) return;
        setDefaultCategories([]);
        setDefaultProductSalesReport([]);
        setData({ categories: [], monthlyRaw: [], dailyRaw: [], quarterRaw: [], quarter: [], year: [], line: [], productSalesReport: [] });
        setChartVersion((prev)=>prev+1);
        setHasLoadedStats(true);
      }
    })();
    return () => { mounted = false; };
  }, [dateFrom, dateTo, hasActiveDateRange, request, statsQueryRange, statsYear]);

  // Khi bấm vào một cột doanh thu, chỉ tải lại doanh thu theo danh mục và
  // chi tiết sản phẩm cho đúng mốc đó; dữ liệu biểu đồ chính vẫn giữ nguyên.
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
        if (statsQueryRange) params.append("range", statsQueryRange);
        if (hasActiveDateRange) {
          params.append("fromDate", dateFrom);
          params.append("toDate", dateTo);
        } else {
          params.append("year", statsYear);
        }
        params.append("categoryRange", selectedBucket.range);

        // Các tham số categoryYear/categoryMonth/categoryQuarter/categoryDay
        // quyết định biểu đồ tròn và bảng chi tiết đang lọc theo mốc nào.
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
  }, [dateFrom, dateTo, defaultCategories, defaultProductSalesReport, hasActiveDateRange, hasLoadedStats, selectedBucket, request, statsQueryRange, statsYear]);

  const donut = (data.categories || []).map((c) => ({ name: c.name, value: Number(c.value || 0), pct: 0 }));
  const total = donut.reduce((s,d)=>s+d.value,0);
  donut.forEach(d=>{ d.pct = total>0?Math.round((d.value/total)*100):0; });
  const sortedYearData = useMemo(() => (data.year || [])
    .slice()
    .sort((a,b)=>Number(a.year)-Number(b.year)), [data.year]);
  const yearChartData = useMemo(() => {
    if (hasActiveDateRange) return sortedYearData;
    return sortedYearData.filter((item)=>String(item.year) === statsYear);
  }, [hasActiveDateRange, sortedYearData, statsYear]);
  const parseDayLabel = (value) => {
    const parts = String(value || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some((part)=>!Number.isFinite(part))) return null;
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  };
  const formatDayValue = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const getDaysInMonth = (year, monthNumber) => new Date(Date.UTC(Number(year), Number(monthNumber), 0)).getUTCDate();

  // Chuyển dữ liệu doanh thu ngày thành dạng có thể lọc theo năm/tháng.
  const drillDayRows = useMemo(() => (data.dailyRaw || [])
    .map((row)=>{
      const date = parseDayLabel(row.dayLabel);
      if (!date) return null;
      return {
        ...row,
        date,
        year: String(date.getUTCFullYear()),
        monthNumber: date.getUTCMonth() + 1,
      };
    })
    .filter(Boolean), [data.dailyRaw]);

  // Khi drill từ tháng xuống ngày, luôn dựng đủ số ngày của tháng
  // 28/29/30/31 ngày; ngày không có đơn vẫn hiện với doanh thu bằng 0.
  const buildMonthDayRows = (year, monthNumber) => {
    const revenueByDay = new Map();
    drillDayRows
      .filter((row)=>String(row.year) === String(year) && Number(row.monthNumber) === Number(monthNumber))
      .forEach((row)=>{
        revenueByDay.set(row.dayLabel, (revenueByDay.get(row.dayLabel) || 0) + Number(row.revenue || 0));
      });

    return Array.from({ length: getDaysInMonth(year, monthNumber) }, (_, index)=>{
      const dayNumber = index + 1;
      const day = `${year}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
      return {
        day,
        label: `${dayNumber}/${Number(monthNumber)}`,
        revenue: revenueByDay.get(day) || 0,
      };
    });
  };
  const selectedBucketLabel = selectedBucket?.label || "Tất cả";
  const chartAnimationKey = `${range}-${drillLevel}-${selectedYearDrill?.year || "all"}-${selectedQuarterDrill?.year || "all"}-${selectedQuarterDrill?.quarter || "all"}-${selectedMonthDrill?.year || "all"}-${selectedMonthDrill?.monthNumber || "all"}-${selectedDayDrill?.day || "all"}-${statsYear}-${dateFrom}-${dateTo}-${chartMode}-${chartVersion}`;
  const reportRows = data.productSalesReport || [];
  const reportTotalQuantity = reportRows.reduce((sum,row)=>sum + Number(row.quantity || 0), 0);
  const reportTotalRevenue = reportRows.reduce((sum,row)=>sum + Number(row.revenue || 0), 0);
  const formatDateLabel = (value) => {
    const parts = String(value || "").split("-");
    if (parts.length !== 3) return value || "";
    const [year, month, day] = parts;
    return `${Number(day)}/${Number(month)}/${year}`;
  };
  const formatDayMonthLabel = (value) => {
    const parts = String(value || "").split("-");
    if (parts.length !== 3) return value || "";
    const [, month, day] = parts;
    return `${Number(day)}/${Number(month)}`;
  };
  const reportRangeLabel = (() => {
    if (selectedBucket) {
      const params = selectedBucket.params || {};
      if (selectedBucket.range === "day") return `Ngày ${formatDayMonthLabel(params.categoryDay)}`;
      if (selectedBucket.range === "month") return `Tháng ${params.categoryMonth}`;
      if (selectedBucket.range === "quarter") return `Quý ${params.categoryQuarter} / ${params.categoryYear}`;
      if (selectedBucket.range === "year") return `Năm ${params.categoryYear}`;
      return selectedBucket.label || "Khoảng đã chọn";
    }

    if (drillLevel === "day" && selectedMonthDrill) return selectedMonthDrill.label || `Tháng ${selectedMonthDrill.monthNumber}`;
    if (selectedQuarterDrill) return selectedQuarterDrill.label || `Quý ${selectedQuarterDrill.quarter}/${selectedQuarterDrill.year}`;
    if (range === "year" && selectedYearDrill) return `Các quý trong năm ${selectedYearDrill.year}`;
    if (hasActiveDateRange) return `Từ ${formatDateLabel(dateFrom)} đến ${formatDateLabel(dateTo)}`;
    if (range === "day") return `Theo ngày trong năm ${statsYear}`;
    if (range === "month") return `Theo tháng trong năm ${statsYear}`;
    if (range === "quarter") return `Theo quý trong năm ${statsYear}`;
    return `Năm ${statsYear}`;
  })();
  const resetDrill = () => {
    setDrillLevel("month");
    setSelectedMonthDrill(null);
    setSelectedDayDrill(null);
    setSelectedQuarterDrill(null);
    setSelectedYearDrill(null);
  };

  const handleRangeChange = (value) => {
    setRange(value);
    setSelectedBucket(null);
    setDataYear(activeYear);
    resetDrill();
  };

  const handleDateFromChange = (value) => {
    setDateFrom(value);
    setSelectedBucket(null);
    resetDrill();
  };

  const handleDateToChange = (value) => {
    setDateTo(value);
    setSelectedBucket(null);
    resetDrill();
  };

  const timeStepperLabel = (() => {
    if (selectedDayDrill) return `Ngày ${formatDateLabel(selectedDayDrill.day)}`;
    if (drillLevel === "day" && selectedMonthDrill) return `Tháng ${selectedMonthDrill.monthNumber}/${selectedMonthDrill.year}`;
    if (selectedQuarterDrill) return `Quý ${selectedQuarterDrill.quarter}/${selectedQuarterDrill.year}`;
    return `Năm ${activeYear}`;
  })();

  const clearDateRangeForStepper = () => {
    setDateFrom("");
    setDateTo("");
  };

  const handleTimeStep = (delta) => {
    clearDateRangeForStepper();

    if (selectedDayDrill) {
      const date = parseDayLabel(selectedDayDrill.day);
      if (!date) return;
      date.setUTCDate(date.getUTCDate() + delta);
      const nextDay = formatDayValue(date);
      const nextYear = String(date.getUTCFullYear());
      const nextMonth = date.getUTCMonth() + 1;
      const nextQuarter = Math.floor((nextMonth - 1) / 3) + 1;
      setSelectedDayDrill({ day: nextDay, label: formatDayMonthLabel(nextDay) });
      setSelectedMonthDrill({
        year: nextYear,
        monthNumber: nextMonth,
        label: `Tháng ${nextMonth}`,
      });
      setSelectedQuarterDrill({
        year: nextYear,
        quarter: nextQuarter,
        label: `Quý ${nextQuarter}/${nextYear}`,
      });
      setSelectedYearDrill({ year: nextYear, label: `Năm ${nextYear}` });
      setActiveYear(nextYear);
      setDataYear(nextYear);
      setSelectedBucket({
        range: "day",
        label: formatDayMonthLabel(nextDay),
        params: { categoryDay: nextDay },
      });
      return;
    }

    if (drillLevel === "day" && selectedMonthDrill) {
      const date = new Date(Date.UTC(Number(selectedMonthDrill.year), Number(selectedMonthDrill.monthNumber) - 1 + delta, 1));
      const nextYear = String(date.getUTCFullYear());
      const nextMonth = date.getUTCMonth() + 1;
      const nextQuarter = Math.floor((nextMonth - 1) / 3) + 1;
      setSelectedMonthDrill({
        year: nextYear,
        monthNumber: nextMonth,
        label: `Tháng ${nextMonth}`,
      });
      setSelectedQuarterDrill({
        year: nextYear,
        quarter: nextQuarter,
        label: `Quý ${nextQuarter}/${nextYear}`,
      });
      setSelectedYearDrill({ year: nextYear, label: `Năm ${nextYear}` });
      setActiveYear(nextYear);
      setDataYear(nextYear);
      setSelectedBucket({
        range: "month",
        label: `Tháng ${nextMonth}`,
        params: {
          categoryYear: nextYear,
          categoryMonth: nextMonth,
        },
      });
      return;
    }

    if (selectedQuarterDrill) {
      const currentIndex = Number(selectedQuarterDrill.year) * 4 + Number(selectedQuarterDrill.quarter) - 1 + delta;
      const normalizedQuarterIndex = ((currentIndex % 4) + 4) % 4;
      const year = String((currentIndex - normalizedQuarterIndex) / 4);
      const quarter = normalizedQuarterIndex + 1;
      setDrillLevel("month");
      setSelectedMonthDrill(null);
      setSelectedDayDrill(null);
      setSelectedQuarterDrill({
        year,
        quarter,
        label: `Quý ${quarter}/${year}`,
      });
      setSelectedYearDrill({ year, label: `Năm ${year}` });
      setActiveYear(year);
      setDataYear(year);
      setSelectedBucket({
        range: "quarter",
        label: `Quý ${quarter}/${year}`,
        params: {
          categoryYear: year,
          categoryQuarter: quarter,
        },
      });
      return;
    }

    const nextYear = String(Number(activeYear) + delta);
    setActiveYear(nextYear);
    setDataYear(nextYear);
    resetDrill();
    setSelectedBucket({
      range: "year",
      label: `Năm ${nextYear}`,
      params: { categoryYear: nextYear },
    });
  };

  const handleBarClick = (bucket) => {
    if (range === "year" && bucket?.range === "year") {
      const year = String(bucket.params?.categoryYear || "");
      setSelectedYearDrill({
        year,
        label: bucket.label,
      });
      if (year) {
        setActiveYear(year);
        setDataYear(year);
      }
      setSelectedQuarterDrill(null);
      setSelectedMonthDrill(null);
      setSelectedDayDrill(null);
      setDrillLevel("month");
      setSelectedBucket(bucket);
      return;
    }

    if (bucket?.range === "quarter") {
      const year = String(bucket.params?.categoryYear || "");
      setSelectedQuarterDrill({
        year,
        quarter: Number(bucket.params?.categoryQuarter || 0),
        label: bucket.label,
      });
      if (year) {
        setActiveYear(year);
        setDataYear(year);
      }
      setSelectedMonthDrill(null);
      setSelectedDayDrill(null);
      setDrillLevel("month");
      setSelectedBucket(bucket);
      return;
    }

    if (bucket?.range === "month") {
      const year = String(bucket.params?.categoryYear || "");
      setDrillLevel("day");
      setSelectedMonthDrill({
        year,
        monthNumber: Number(bucket.params?.categoryMonth || 0),
        label: `Tháng ${Number(bucket.params?.categoryMonth || 0)}`,
      });
      if (year) {
        setActiveYear(year);
        setDataYear(year);
      }
      setSelectedDayDrill(null);
      setSelectedBucket(bucket);
      return;
    }

    if (bucket?.range === "day") {
      const day = String(bucket.params?.categoryDay || "");
      const year = day.slice(0, 4);
      if (/^\d{4}$/.test(year)) {
        setActiveYear(year);
        setDataYear(year);
      }
      setSelectedDayDrill(day ? { day, label: bucket.label || formatDateLabel(day) } : null);
    }

    setSelectedBucket(bucket);
  };

  const handleDrillBack = () => {
    setSelectedBucket(null);
    if (drillLevel === "day") {
      setDrillLevel("month");
      setSelectedMonthDrill(null);
      setSelectedDayDrill(null);
      return;
    }

    if (selectedQuarterDrill) {
      setSelectedMonthDrill(null);
      setSelectedQuarterDrill(null);
      return;
    }

    if (range === "year" && selectedYearDrill) {
      setSelectedYearDrill(null);
      return;
    }

    resetDrill();
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
    const hasChartData = (rows || []).some((row)=>Number(row?.revenue || 0) > 0);
    const chartRows = (rows || []).length ? rows : [{ [xKey]: "Không có dữ liệu", revenue: 0 }];
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
      <ComposedChart key={`chart-${chartAnimationKey}`} data={chartRows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
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
        {!hasChartData && (
          <Customized
            component={({ width, height }) => (
              <text
                x={Number(width || 0) / 2}
                y={Number(height || 0) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#64748b"
                fontSize={14}
                fontWeight={700}
              >
                Không có dữ liệu
              </text>
            )}
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
                  {(selectedMonthDrill || selectedQuarterDrill || (range === "year" && selectedYearDrill)) && (
                    <div className="stats-drill-actions">
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleDrillBack}>
                        {drillLevel === "day" ? "Quay lại tháng" : selectedQuarterDrill ? "Quay lại quý" : selectedMonthDrill ? "Quay lại tháng" : "Quay lại năm"}
                      </button>
                      <span className="small text-muted">
                        {drillLevel === "day" ? selectedMonthDrill?.label : selectedQuarterDrill?.label || selectedMonthDrill?.label || selectedYearDrill?.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="stats-controls">
                <select className="form-select" value={range} onChange={(e)=>handleRangeChange(e.target.value)}>
                  <option value="month">Theo tháng</option>
                  <option value="quarter">Theo quý</option>
                  <option value="year">Theo năm</option>
                </select>
                <div className="stats-filter-mode date-range-active">
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
                </div>
              </div>
            </div>

            <div key={`bar-frame-${chartAnimationKey}`} className="stats-chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                {(() => {
                  if (drillLevel === "day" && selectedMonthDrill) {
                    const days = buildMonthDayRows(selectedMonthDrill.year, selectedMonthDrill.monthNumber);

                    return renderRevenueChart(days, "label", "day", (entry)=>handleBarClick({
                      range: "day",
                      label: entry?.payload?.label,
                      params: { categoryDay: entry?.payload?.day },
                    }));
                  }

                  if (selectedQuarterDrill) {
                    const year = selectedQuarterDrill.year;
                    const quarter = Number(selectedQuarterDrill.quarter);
                    const startMonth = (quarter - 1) * 3 + 1;
                    const monthNumbers = [startMonth, startMonth + 1, startMonth + 2];
                    const map = {};
                    (data.monthlyRaw || []).forEach((row)=>{
                      const monthLabel = row.monthLabel || "";
                      if (monthLabel.startsWith(year)) {
                        const monthNumber = Number(monthLabel.slice(5, 7));
                        if (monthNumbers.includes(monthNumber)) {
                          map[monthNumber] = (map[monthNumber] || 0) + Number(row.revenue || 0);
                        }
                      }
                    });
                    const months = monthNumbers.map((monthNumber)=>({
                      month: `Tháng ${monthNumber}`,
                      monthNumber,
                      revenue: map[monthNumber] || 0,
                    }));

                    return renderRevenueChart(months, "month", "month", (entry)=>handleBarClick({
                      range: "month",
                      label: entry?.payload?.month,
                      params: {
                        categoryYear: year,
                        categoryMonth: entry?.payload?.monthNumber,
                      },
                    }));
                  }

                  if (range === "day") {
                    const rows = (data.dailyRaw || [])
                      .filter(r=>hasActiveDateRange || String(r.dayLabel||"").startsWith(statsYear))
                      .sort((a,b)=>String(a.dayLabel||"").localeCompare(String(b.dayLabel||"")));
                    const visibleRows = hasActiveDateRange ? rows : rows.slice(-60);
                    const bars = visibleRows.map(r=>({ day: formatDayMonthLabel(r.dayLabel), rawDay: r.dayLabel, revenue: r.revenue }));
                    return renderRevenueChart(bars, "day", "day", (entry)=>handleBarClick({
                      range: "day",
                      label: formatDayMonthLabel(entry?.payload?.day),
                      params: { categoryDay: entry?.payload?.rawDay },
                    }));
                  }

                  if (range === "month") {
                    const year = statsYear;
                    if (hasActiveDateRange) {
                      const months = (data.monthlyRaw || [])
                        .slice()
                        .sort((a,b)=>String(a.monthLabel||"").localeCompare(String(b.monthLabel||"")))
                        .map((r)=>{
                          const monthLabel = r.monthLabel || "";
                          const rowYear = monthLabel.slice(0,4);
                          const monthNumber = Number(monthLabel.slice(5,7));
                          return {
                            month: `Tháng ${monthNumber}`,
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

                    if (drillLevel === "day" && selectedMonthDrill) {
                      const days = buildMonthDayRows(selectedMonthDrill.year, selectedMonthDrill.monthNumber);

                      return renderRevenueChart(days, "label", "day", (entry)=>handleBarClick({
                        range: "day",
                        label: entry?.payload?.label,
                        params: { categoryDay: entry?.payload?.day },
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
                      label: entry?.payload?.month,
                      params: {
                        categoryYear: year,
                        categoryMonth: entry?.payload?.monthNumber,
                      },
                    }));
                  }

                  if (range === "quarter") {
                    if (hasActiveDateRange) {
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

                    const year = statsYear;
                    const quarters = [1,2,3,4].map(qnum=>({ label: `Quý ${qnum}`, quarter: qnum, revenue: (data.quarterRaw||[]).filter(r=>String(r.year)===year && r.quarter===qnum).reduce((s,r)=>s+r.revenue,0) }));
                    return renderRevenueChart(quarters, "label", "quarter", (entry)=>handleBarClick({
                      range: "quarter",
                      label: `${entry?.payload?.label} / ${year}`,
                      params: {
                        categoryYear: year,
                        categoryQuarter: entry?.payload?.quarter,
                      },
                    }));
                  }

                  if (range === "year" && selectedYearDrill) {
                    const year = selectedYearDrill.year;
                    const map = {};
                    (data.quarterRaw || []).forEach((row)=>{
                      if (String(row.year) === String(year)) {
                        const quarter = Number(row.quarter);
                        map[quarter] = (map[quarter] || 0) + Number(row.revenue || 0);
                      }
                    });
                    const quarters = Array.from({ length: 4 }, (_, index)=>{
                      const quarter = index + 1;
                      return {
                        label: `Quý ${quarter}`,
                        quarter,
                        revenue: map[quarter] || 0,
                      };
                    });

                    return renderRevenueChart(quarters, "label", "quarter", (entry)=>handleBarClick({
                      range: "quarter",
                      label: `${entry?.payload?.label} / ${year}`,
                      params: {
                        categoryYear: year,
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
            <div className="stats-chart-year-stepper">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>handleTimeStep(-1)}>
                &lt;-
              </button>
              <div className="stats-year-stepper__label">{timeStepperLabel}</div>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>handleTimeStep(1)}>
                -&gt;
              </button>
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
              <ResponsiveContainer width="100%" height="100%">
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
