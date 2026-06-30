import React, { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import {
  FaBoxOpen,
  FaChartLine,
  FaClipboardList,
  FaFileExcel,
  FaStore,
  FaTags,
  FaTicketAlt,
  FaTruckLoading,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./overview.scss";

const formatNumber = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));
const formatVND = (value) => `${formatNumber(value)} đ`;
const currentYear = new Date().getFullYear();

const emptyOverview = {
  counts: {},
  summary: {},
  topProducts: [],
  topCategories: [],
  topCustomers: [],
  orderStatus: [],
  recentOrders: [],
};

const resolveProductImage = (image) => {
  const raw = String(image || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/uploads")) return `${API_BASE}${raw}`;
  return `${UPLOAD_BASE}/pictures/${raw}`;
};

const StatCard = ({ title, value, note, accent, icon: Icon, path, onOpen }) => (
  <button
    type="button"
    className={`overview-stat-card ${accent || ""}`}
    onClick={() => path && onOpen(path)}
  >
    <span className="stat-head">
      <span>
        <span className="stat-title">{title}</span>
        <span className="stat-note">{note}</span>
      </span>
      {Icon && (
        <span className="stat-icon">
          <Icon />
        </span>
      )}
    </span>
    <strong>{formatNumber(value)}</strong>
  </button>
);

const getRankedItemPath = (item, type) => {
  if (type === "product" && item.ProductID) {
    return `/admin/product/detail/${encodeURIComponent(String(item.ProductID))}`;
  }
  if (type === "category" && item.CategoryID) {
    return `/admin/product/categories/${encodeURIComponent(String(item.CategoryID))}/products`;
  }
  if (type === "customer" && item.CustomerID) {
    return `/admin/customer/${encodeURIComponent(String(item.CustomerID))}`;
  }
  return "";
};

const RankedList = ({ title, items, type, actionLabel, actionPath, onOpen }) => (
  <section className="overview-panel">
    <div className="panel-head">
      <div>
        <h5>{title}</h5>
        <span>{formatNumber(items.length)} mục nổi bật</span>
      </div>
      {actionPath && (
        <button type="button" className="panel-action" onClick={() => onOpen(actionPath)}>
          {actionLabel || "Xem thêm"}
        </button>
      )}
    </div>
    <div className="ranked-list">
      {items.length === 0 ? (
        <div className="empty-row">Chưa có dữ liệu</div>
      ) : (
        items.map((item, index) => {
          const name = item.ProductName || item.CategoryName || item.CustomerName || "Chưa rõ";
          const subtitle =
            type === "customer"
              ? `${formatNumber(item.OrderCount)} đơn hàng`
              : `${formatNumber(item.Quantity)} lượt mua`;
          const image = type === "product" ? resolveProductImage(item.Image) : "";
          const itemPath = getRankedItemPath(item, type);

          return (
            <button
              type="button"
              className="ranked-item"
              key={`${type}-${index}-${name}`}
              onClick={() => itemPath && onOpen(itemPath)}
              disabled={!itemPath}
            >
              <div className="rank-index">{index + 1}</div>
              {type === "product" && (
                <div className="rank-thumb">
                  {image ? <img src={image} alt={name} /> : <span>{name.slice(0, 1)}</span>}
                </div>
              )}
              <div className="rank-main">
                <strong title={name}>{name}</strong>
                <span>{subtitle}</span>
              </div>
              <div className="rank-value">{formatVND(item.Revenue)}</div>
            </button>
          );
        })
      )}
    </div>
  </section>
);

const normalizeTopCustomers = (items = []) => {
  const map = new Map();
  items.forEach((item) => {
    const key = String(item.CustomerID || item.CustomerPhone || item.CustomerName || "").trim();
    if (!key) return;
    const current = map.get(key);
    if (!current) {
      map.set(key, { ...item });
      return;
    }
    current.OrderCount = Number(current.OrderCount || 0) + Number(item.OrderCount || 0);
    current.Revenue = Number(current.Revenue || 0) + Number(item.Revenue || 0);
  });
  return Array.from(map.values())
    .sort((a, b) => Number(b.OrderCount || 0) - Number(a.OrderCount || 0) || Number(b.Revenue || 0) - Number(a.Revenue || 0));
};

const getCellValue = (row, key) => {
  if (typeof key === "function") return key(row);
  return row?.[key] ?? "";
};

const normalizeSheetRows = (rows = []) => (Array.isArray(rows) ? rows : []);

const toNumber = (value) => {
  const normalized = String(value ?? "").replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isPaidOrder = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  return (
    normalized.startsWith("đã thanh toán") ||
    normalized.includes("thanh toán cod") ||
    normalized === "thanh toán cod"
  );
};

const getOrderId = (order) => order?.OrderID || order?.OrderId || order?.id || "";
const getOrderDate = (order) => order?.CreatedAt || order?.createdAt || order?.date || order?.OrderDate || "";
const getOrderCustomer = (order) => order?.CustomerName || order?.customerName || order?.customer || "";
const getOrderPhone = (order) => order?.CustomerPhone || order?.phone || order?.PhoneNumber || "";
const getOrderAddress = (order) => order?.CustomerAddress || order?.address || order?.Address || "";
const getOrderStatus = (order) => order?.Status || order?.status || "";
const getOrderTotal = (order) => toNumber(order?.TotalRaw ?? order?.Total ?? order?.total);

const getDateKey = (value, length = 10) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, length) : "Không rõ";
};

const groupRevenueBy = (orders = [], keyGetter) => {
  const map = new Map();
  orders.filter((order) => isPaidOrder(getOrderStatus(order))).forEach((order) => {
    const key = keyGetter(order);
    if (!map.has(key)) {
      map.set(key, {
        TimeLabel: key,
        OrderCount: 0,
        RevenueRaw: 0,
      });
    }
    const row = map.get(key);
    row.OrderCount += 1;
    row.RevenueRaw += getOrderTotal(order);
  });

  return Array.from(map.values())
    .sort((a, b) => String(a.TimeLabel).localeCompare(String(b.TimeLabel)))
    .map((row, index) => ({
      STT: index + 1,
      TimeLabel: row.TimeLabel,
      OrderCount: row.OrderCount,
      RevenueRaw: row.RevenueRaw,
      Revenue: formatVND(row.RevenueRaw),
    }));
};

const getRevenueOverviewRows = (orders = []) => {
  const paidOrders = orders.filter((order) => isPaidOrder(getOrderStatus(order)));
  const paidRevenue = paidOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const allRevenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);

  return [
    { Label: "Tổng đơn hàng", Value: orders.length },
    { Label: "Đơn đã tính doanh thu", Value: paidOrders.length },
    { Label: "Doanh thu đã thanh toán", Value: formatVND(paidRevenue) },
    { Label: "Giá trị trung bình/đơn", Value: formatVND(paidOrders.length ? paidRevenue / paidOrders.length : 0) },
    { Label: "Tổng giá trị tất cả đơn", Value: formatVND(allRevenue) },
  ];
};

const getRevenueOrderRows = (orders = []) =>
  orders.filter((order) => isPaidOrder(getOrderStatus(order))).map((order, index) => ({
    STT: index + 1,
    OrderID: getOrderId(order),
    CustomerName: getOrderCustomer(order),
    Phone: getOrderPhone(order),
    Address: getOrderAddress(order),
    CreatedAt: getOrderDate(order),
    Status: getOrderStatus(order),
    ProductCount: Array.isArray(order.details) ? order.details.length : 0,
    Total: formatVND(getOrderTotal(order)),
  }));

const getRevenueOrderDetailRows = (orders = []) => {
  const rows = [];

  orders.filter((order) => isPaidOrder(getOrderStatus(order))).forEach((order) => {
    const details = Array.isArray(order.details) ? order.details : [];
    if (!details.length) {
      rows.push({
        OrderID: getOrderId(order),
        CustomerName: getOrderCustomer(order),
        Phone: getOrderPhone(order),
        Address: getOrderAddress(order),
        CreatedAt: getOrderDate(order),
        Status: getOrderStatus(order),
        ProductName: "",
        Quantity: "",
        UnitPrice: "",
        LineTotal: "",
      });
      return;
    }

    details.forEach((detail) => {
      const quantity = Number(detail.qty || detail.Quantity || 0) || 0;
      const unitPrice = toNumber(detail.price || detail.UnitPrice || detail.UnitPriceRaw);
      rows.push({
        OrderID: getOrderId(order),
        CustomerName: getOrderCustomer(order),
        Phone: getOrderPhone(order),
        Address: getOrderAddress(order),
        CreatedAt: getOrderDate(order),
        Status: getOrderStatus(order),
        ProductName: detail.name || detail.ProductName || "",
        Quantity: quantity,
        UnitPrice: formatVND(unitPrice),
        LineTotal: formatVND(toNumber(detail.lineTotal || detail.LineTotalRaw) || unitPrice * quantity),
      });
    });
  });

  return rows.map((row, index) => ({ STT: index + 1, ...row }));
};

const addReportSheet = (workbook, sheetName, rows, columns) => {
  const safeName = String(sheetName || "Sheet").slice(0, 31);
  const worksheet = workbook.addWorksheet(safeName);
  const normalizedRows = normalizeSheetRows(rows);

  const titleRow = worksheet.addRow([sheetName]);
  titleRow.font = { bold: true, size: 18, color: { argb: "FF0F172A" } };
  titleRow.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.mergeCells(1, 1, 1, Math.max(columns.length, 1));
  worksheet.getRow(1).height = 28;

  const metaRow = worksheet.addRow([`Ngày xuất: ${new Date().toLocaleString("vi-VN")}`]);
  metaRow.font = { size: 11, color: { argb: "FF64748B" } };
  worksheet.mergeCells(2, 1, 2, Math.max(columns.length, 1));
  worksheet.addRow([]);

  const headerRow = worksheet.addRow(columns.map((column) => column.header));
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F766E" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  if (!normalizedRows.length) {
    worksheet.addRow(["Không có dữ liệu"]);
    worksheet.mergeCells(5, 1, 5, Math.max(columns.length, 1));
  } else {
    normalizedRows.forEach((row, rowIndex) => {
      const dataRow = worksheet.addRow(columns.map((column) => getCellValue(row, column.key)));
      const bgColor = rowIndex % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";
      dataRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
        cell.alignment = { vertical: "middle", wrapText: true };
      });
    });
  }

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  columns.forEach((column, index) => {
    worksheet.getColumn(index + 1).width = column.width || 18;
  });
};

const downloadWorkbook = async (workbook, fileName) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const AdminOverviewPage = () => {
  const navigate = useNavigate();
  const { request, loading } = useHttp();
  const [overview, setOverview] = useState(emptyOverview);
  const [exportingReport, setExportingReport] = useState("");

  const openPath = (path) => {
    navigate(path);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/admin/stats/overview`);
        const payload = res.data || res;
        if (!mounted) return;
        setOverview({
          counts: payload.counts || {},
          summary: payload.summary || {},
          topProducts: payload.topProducts || [],
          topCategories: payload.topCategories || [],
          topCustomers: normalizeTopCustomers(payload.topCustomers || []),
          orderStatus: payload.orderStatus || [],
          recentOrders: payload.recentOrders || [],
        });
      } catch (err) {
        console.error("Failed to load admin overview:", err?.message || err);
      }
    })();

    return () => { mounted = false; };
  }, [request]);

  const managementStats = useMemo(() => ([
    { title: "Sản phẩm", value: overview.counts.Products, note: "Đang hiển thị", accent: "blue", icon: FaBoxOpen, path: "/admin/product" },
    { title: "Đơn hàng", value: overview.counts.Orders, note: "Tổng đơn", accent: "green", icon: FaClipboardList, path: "/admin/order" },
    { title: "Danh mục", value: overview.counts.Categories, note: "Nhóm sản phẩm", accent: "orange", icon: FaTags, path: "/admin/product/categories" },
    { title: "Khách hàng", value: overview.counts.Customers, note: "Đang hoạt động", accent: "purple", icon: FaUsers, path: "/admin/customer" },
    { title: "Thương hiệu", value: overview.counts.Brands, note: "Nhà cung cấp", accent: "cyan", icon: FaStore, path: "/admin/brand" },
    { title: "Lô hàng", value: overview.counts.Batches, note: "Còn hiệu lực", accent: "slate", icon: FaTruckLoading, path: "/admin/shipment" },
    { title: "Voucher", value: overview.counts.Vouchers, note: "Mã ưu đãi", accent: "pink", icon: FaTicketAlt, path: "/admin/voucher" },
    { title: "Tài khoản", value: overview.counts.Accounts, note: "Người dùng", accent: "indigo", icon: FaUserShield, path: "/admin/account" },
  ]), [overview.counts]);

  const maxStatus = Math.max(...overview.orderStatus.map((item) => Number(item.Total || 0)), 1);
  const averageOrderValue = overview.summary.PaidOrders
    ? Number(overview.summary.PaidRevenue || 0) / Number(overview.summary.PaidOrders || 1)
    : 0;

  const getManagementRows = () => managementStats.map((item, index) => ({
    STT: index + 1,
    Item: item.title,
    Note: item.note,
    Value: Number(item.value || 0),
  }));

  const addOverviewSheets = (workbook) => {
    addReportSheet(workbook, "Tổng quan", getManagementRows(), [
      { header: "STT", key: "STT", width: 8 },
      { header: "Mục quản lý", key: "Item", width: 26 },
      { header: "Ghi chú", key: "Note", width: 28 },
      { header: "Số lượng", key: "Value", width: 16 },
    ]);

    addReportSheet(workbook, "Top sản phẩm", overview.topProducts.map((item, index) => ({
      STT: index + 1,
      ProductID: item.ProductID,
      ProductName: item.ProductName,
      Quantity: Number(item.Quantity || 0),
      Revenue: formatVND(item.Revenue),
    })), [
      { header: "STT", key: "STT", width: 8 },
      { header: "Mã sản phẩm", key: "ProductID", width: 18 },
      { header: "Tên sản phẩm", key: "ProductName", width: 42 },
      { header: "Số lượng bán", key: "Quantity", width: 18 },
      { header: "Doanh thu", key: "Revenue", width: 18 },
    ]);

    addReportSheet(workbook, "Top khách hàng", overview.topCustomers.map((item, index) => ({
      STT: index + 1,
      CustomerID: item.CustomerID,
      CustomerName: item.CustomerName,
      OrderCount: Number(item.OrderCount || 0),
      Revenue: formatVND(item.Revenue),
    })), [
      { header: "STT", key: "STT", width: 8 },
      { header: "Mã khách hàng", key: "CustomerID", width: 22 },
      { header: "Tên khách hàng", key: "CustomerName", width: 30 },
      { header: "Số đơn", key: "OrderCount", width: 14 },
      { header: "Doanh thu", key: "Revenue", width: 18 },
    ]);

    addReportSheet(workbook, "Trạng thái đơn", overview.orderStatus.map((item, index) => ({
      STT: index + 1,
      Status: item.Status,
      Total: Number(item.Total || 0),
    })), [
      { header: "STT", key: "STT", width: 8 },
      { header: "Trạng thái", key: "Status", width: 28 },
      { header: "Số đơn", key: "Total", width: 14 },
    ]);
  };

  const addRevenueSheets = (workbook, _statsPayload = {}, orders = [], mode = "interactive") => {
    if (mode === "detail") {
      addReportSheet(workbook, "Chi tiết doanh thu", getRevenueOrderRows(orders), [
        { header: "STT", key: "STT", width: 8 },
        { header: "Mã đơn", key: "OrderID", width: 26 },
        { header: "Khách hàng", key: "CustomerName", width: 28 },
        { header: "Số điện thoại", key: "Phone", width: 18 },
        { header: "Địa chỉ", key: "Address", width: 42 },
        { header: "Ngày đặt", key: "CreatedAt", width: 18 },
        { header: "Trạng thái", key: "Status", width: 22 },
        { header: "Số dòng SP", key: "ProductCount", width: 14 },
        { header: "Tổng tiền", key: "Total", width: 18 },
      ]);

      addReportSheet(workbook, "Sản phẩm trong đơn", getRevenueOrderDetailRows(orders), [
        { header: "STT", key: "STT", width: 8 },
        { header: "Mã đơn", key: "OrderID", width: 26 },
        { header: "Khách hàng", key: "CustomerName", width: 28 },
        { header: "Số điện thoại", key: "Phone", width: 18 },
        { header: "Địa chỉ", key: "Address", width: 42 },
        { header: "Ngày đặt", key: "CreatedAt", width: 18 },
        { header: "Trạng thái", key: "Status", width: 22 },
        { header: "Sản phẩm", key: "ProductName", width: 42 },
        { header: "SL", key: "Quantity", width: 10 },
        { header: "Đơn giá", key: "UnitPrice", width: 18 },
        { header: "Thành tiền", key: "LineTotal", width: 18 },
      ]);
      return;
    }

    const worksheet = workbook.addWorksheet("Doanh thu");
    const dayRows = groupRevenueBy(orders, (order) => getDateKey(getOrderDate(order), 10));
    const monthRows = groupRevenueBy(orders, (order) => getDateKey(getOrderDate(order), 7));
    const yearRows = groupRevenueBy(orders, (order) => getDateKey(getOrderDate(order), 4));
    const detailRows = getRevenueOrderRows(orders);
    const maxSummaryRows = Math.max(dayRows.length, monthRows.length, yearRows.length, 1);
    const detailStartRow = maxSummaryRows + 10;

    worksheet.mergeCells("A1:D1");
    worksheet.getCell("A1").value = "Báo cáo doanh thu";
    worksheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FF0F172A" } };
    worksheet.getCell("A1").alignment = { horizontal: "center" };
    worksheet.getCell("A2").value = `Ngày xuất: ${new Date().toLocaleString("vi-VN")}`;
    worksheet.getCell("A2").font = { color: { argb: "FF64748B" } };

    worksheet.getCell("A3").value = "Chọn cách tính";
    worksheet.getCell("A3").font = { bold: true };
    worksheet.getCell("B3").value = "Ngày";
    worksheet.getCell("B3").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Ngày,Tháng,Năm"'],
    };
    worksheet.getCell("C3").value = "Đổi lựa chọn ở ô B3 để bảng bên dưới tự cập nhật.";
    worksheet.getCell("C3").font = { italic: true, color: { argb: "FF64748B" } };

    const overviewRows = getRevenueOverviewRows(orders);
    overviewRows.forEach((row, index) => {
      const currentRow = worksheet.getRow(3 + index);
      currentRow.getCell(5).value = row.Label;
      currentRow.getCell(6).value = row.Value;
      currentRow.getCell(5).font = { bold: true };
    });

    const visibleHeader = worksheet.getRow(5);
    ["STT", "Mốc thời gian", "Số đơn", "Doanh thu"].forEach((header, index) => {
      const cell = visibleHeader.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
      cell.alignment = { horizontal: "center" };
    });

    const writeHelperTable = (startColumn, rows) => {
      const headers = ["STT", "Mốc thời gian", "Số đơn", "Doanh thu"];
      headers.forEach((header, index) => {
        worksheet.getRow(5).getCell(startColumn + index).value = header;
      });
      rows.forEach((row, index) => {
        const currentRow = worksheet.getRow(6 + index);
        currentRow.getCell(startColumn).value = row.STT;
        currentRow.getCell(startColumn + 1).value = row.TimeLabel;
        currentRow.getCell(startColumn + 2).value = row.OrderCount;
        currentRow.getCell(startColumn + 3).value = row.RevenueRaw;
      });
    };

    writeHelperTable(20, dayRows);
    writeHelperTable(24, monthRows);
    writeHelperTable(28, yearRows);

    for (let index = 0; index < maxSummaryRows; index += 1) {
      const rowNumber = 6 + index;
      const row = worksheet.getRow(rowNumber);
      row.getCell(1).value = { formula: `IF($B$3="Ngày",IF($T${rowNumber}="","",$T${rowNumber}),IF($B$3="Tháng",IF($X${rowNumber}="","",$X${rowNumber}),IF($AB${rowNumber}="","",$AB${rowNumber})))` };
      row.getCell(2).value = { formula: `IF($B$3="Ngày",IF($U${rowNumber}="","",$U${rowNumber}),IF($B$3="Tháng",IF($Y${rowNumber}="","",$Y${rowNumber}),IF($AC${rowNumber}="","",$AC${rowNumber})))` };
      row.getCell(3).value = { formula: `IF($B$3="Ngày",IF($V${rowNumber}="","",$V${rowNumber}),IF($B$3="Tháng",IF($Z${rowNumber}="","",$Z${rowNumber}),IF($AD${rowNumber}="","",$AD${rowNumber})))` };
      row.getCell(4).value = { formula: `IF($B$3="Ngày",IF($W${rowNumber}="","",$W${rowNumber}),IF($B$3="Tháng",IF($AA${rowNumber}="","",$AA${rowNumber}),IF($AE${rowNumber}="","",$AE${rowNumber})))` };
      row.getCell(4).numFmt = '#,##0 "đ"';
    }

    const detailTitleRow = worksheet.getRow(detailStartRow);
    detailTitleRow.getCell(1).value = "Chi tiết đơn hàng tính doanh thu";
    detailTitleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF0F172A" } };
    worksheet.mergeCells(detailStartRow, 1, detailStartRow, 9);

    const detailHeaderRow = worksheet.getRow(detailStartRow + 2);
    ["STT", "Mã đơn", "Khách hàng", "Số điện thoại", "Địa chỉ", "Ngày đặt", "Trạng thái", "Số dòng SP", "Tổng tiền"].forEach((header, index) => {
      const cell = detailHeaderRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF164E63" } };
      cell.alignment = { horizontal: "center" };
    });

    detailRows.forEach((detail, index) => {
      const row = worksheet.getRow(detailStartRow + 3 + index);
      row.values = [
        detail.STT,
        detail.OrderID,
        detail.CustomerName,
        detail.Phone,
        detail.Address,
        detail.CreatedAt,
        detail.Status,
        detail.ProductCount,
        detail.Total,
      ];
    });

    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((column) => {
      worksheet.getColumn(column).width = [8, 24, 28, 18, 42, 18, 22, 14, 18][column - 1];
    });
    [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].forEach((column) => {
      worksheet.getColumn(column).hidden = true;
    });

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { ...cell.alignment, vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });
  };

  const addProductsSheet = (workbook, products = []) => {
    addReportSheet(workbook, "Sản phẩm", products.map((item, index) => ({
      STT: index + 1,
      ProductID: item.ProductID,
      ProductName: item.ProductName,
      CategoryName: item.CategoryName,
      SubCategoryName: item.SubCategoryName,
      Price: formatVND(item.Price),
      SalePrice: Number(item.sale_price || 0) > 0 ? formatVND(item.sale_price) : "",
      StockQuantity: Number(item.StockQuantity || 0),
    })), [
      { header: "STT", key: "STT", width: 8 },
      { header: "Mã sản phẩm", key: "ProductID", width: 18 },
      { header: "Tên sản phẩm", key: "ProductName", width: 42 },
      { header: "Danh mục", key: "CategoryName", width: 24 },
      { header: "Danh mục con", key: "SubCategoryName", width: 24 },
      { header: "Giá", key: "Price", width: 18 },
      { header: "Giá sale", key: "SalePrice", width: 18 },
      { header: "Tồn kho", key: "StockQuantity", width: 14 },
    ]);
  };

  const addCustomersSheet = (workbook, customers = []) => {
    addReportSheet(workbook, "Khách hàng", customers.map((item, index) => ({
      STT: index + 1,
      CustomerID: item.CustomerID,
      FullName: item.FullName || item.CustomerName,
      Email: item.Email,
      PhoneNumber: item.PhoneNumber,
      Address: item.Address,
      IsActive: [false, 0, "0"].includes(item.isActive ?? item.IsActive) ? "Không" : "Có",
    })), [
      { header: "STT", key: "STT", width: 8 },
      { header: "Mã khách hàng", key: "CustomerID", width: 18 },
      { header: "Tên khách hàng", key: "FullName", width: 28 },
      { header: "Email", key: "Email", width: 32 },
      { header: "Số điện thoại", key: "PhoneNumber", width: 18 },
      { header: "Địa chỉ", key: "Address", width: 42 },
      { header: "Hoạt động", key: "IsActive", width: 14 },
    ]);
  };

  const addOrdersSheet = (workbook, orders = []) => {
    addReportSheet(workbook, "Đơn hàng", orders.map((item, index) => ({
      STT: index + 1,
      OrderID: getOrderId(item),
      CustomerName: getOrderCustomer(item),
      Phone: getOrderPhone(item),
      Address: getOrderAddress(item),
      CreatedAt: getOrderDate(item),
      Status: getOrderStatus(item),
      ProductCount: Array.isArray(item.details) ? item.details.length : 0,
      Total: formatVND(getOrderTotal(item)),
    })), [
      { header: "STT", key: "STT", width: 8 },
      { header: "Mã đơn", key: "OrderID", width: 24 },
      { header: "Khách hàng", key: "CustomerName", width: 28 },
      { header: "Số điện thoại", key: "Phone", width: 18 },
      { header: "Địa chỉ", key: "Address", width: 42 },
      { header: "Ngày đặt", key: "CreatedAt", width: 24 },
      { header: "Trạng thái", key: "Status", width: 24 },
      { header: "Số dòng SP", key: "ProductCount", width: 14 },
      { header: "Tổng tiền", key: "Total", width: 18 },
    ]);
  };

  const loadExportData = async (type) => {
    const revenueTypes = ["revenue", "revenue-detail"];

    const statsPromise = type === "all"
      ? request("GET", `${API_BASE}/api/admin/stats?year=${currentYear}&_=${Date.now()}`).then((res) => res.data || res)
      : Promise.resolve(null);

    const productsPromise = (type === "all" || type === "products")
      ? request("GET", `${API_BASE}/api/user/products/loadAllProducts`).then((res) => res.data || [])
      : Promise.resolve(null);

    const customersPromise = (type === "all" || type === "customers")
      ? request("GET", `${API_BASE}/api/admin/customers`).then((res) => res.data || [])
      : Promise.resolve(null);

    const ordersPromise = (type === "all" || type === "orders" || revenueTypes.includes(type))
      ? request("GET", `${API_BASE}/api/admin/orders`).then((res) => res.data || [])
      : Promise.resolve(null);

    const [stats, products, customers, orders] = await Promise.all([
      statsPromise,
      productsPromise,
      customersPromise,
      ordersPromise,
    ]);

    return { stats, products, customers, orders };
  };

  const handleExportReport = async (type) => {
    if (exportingReport) return;

    setExportingReport(type);

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Tiny Shop Admin";
      workbook.created = new Date();

      if (type === "all") addOverviewSheets(workbook);

      const { stats, products, customers, orders } = await loadExportData(type);

      const revenueModes = {
        revenue: "interactive",
        "revenue-detail": "detail",
      };

      if (type === "all" || revenueModes[type]) {
        addRevenueSheets(workbook, stats || {}, orders || [], type === "all" ? "interactive" : revenueModes[type]);
      }
      if (type === "all" || type === "products") addProductsSheet(workbook, products || []);
      if (type === "all" || type === "customers") addCustomersSheet(workbook, customers || []);
      if (type === "all" || type === "orders") addOrdersSheet(workbook, orders || []);

      const reportNames = {
        all: "bao-cao-quan-tri",
        revenue: "bao-cao-doanh-thu",
        "revenue-detail": "chi-tiet-doanh-thu",
        products: "danh-sach-san-pham",
        customers: "danh-sach-khach-hang",
        orders: "danh-sach-don-hang",
      };
      const today = new Date().toISOString().slice(0, 10);
      await downloadWorkbook(workbook, `${reportNames[type] || "bao-cao"}-${today}.xlsx`);
    } catch (error) {
      console.error("Export overview report failed:", error);
      window.alert(error?.message || "Không thể xuất file Excel.");
    } finally {
      setExportingReport("");
    }
  };

  if (loading && !overview.counts.Products) {
    return <div className="admin-overview-page">Đang tải tổng quan...</div>;
  }

  return (
    <div className="admin-overview-page">
      <div className="overview-header">
        <div className="overview-title-block">
          <div className="overview-title-content">
            <h4>Tổng quan quản trị</h4>
            <p>Theo dõi nhanh quy mô dữ liệu, nhóm bán chạy và khách hàng nổi bật.</p>
            <div className="overview-export-actions">
              <button
                type="button"
                className="overview-export-main"
                onClick={() => handleExportReport("all")}
                disabled={Boolean(exportingReport)}
              >
                <FaFileExcel />
                {exportingReport === "all" ? "Đang xuất..." : "Xuất tất cả"}
              </button>
              <button type="button" onClick={() => handleExportReport("revenue")} disabled={Boolean(exportingReport)}>
                Doanh thu
              </button>
              <button type="button" onClick={() => handleExportReport("revenue-detail")} disabled={Boolean(exportingReport)}>
                Chi tiết doanh thu
              </button>
              <button type="button" onClick={() => handleExportReport("customers")} disabled={Boolean(exportingReport)}>
                Khách hàng
              </button>
              <button type="button" onClick={() => handleExportReport("products")} disabled={Boolean(exportingReport)}>
                Sản phẩm
              </button>
              <button type="button" onClick={() => handleExportReport("orders")} disabled={Boolean(exportingReport)}>
                Đơn hàng
              </button>
            </div>
          </div>
          <div className="overview-brand-logo" aria-label="Logo cửa hàng">
            <img src={`${UPLOAD_BASE}/images/logo-removebg.png`} alt="Tiny Store" loading="lazy" />
          </div>
        </div>
        <div className="overview-revenue">
          <span className="revenue-label">
            <FaChartLine />
            Doanh thu đã thanh toán
          </span>
          <strong>{formatVND(overview.summary.PaidRevenue)}</strong>
          <div className="overview-revenue-metrics">
            <small>
              <b>{formatNumber(overview.summary.PaidOrders)}</b>
              đơn thanh toán
            </small>
            <small>
              <b>{formatVND(averageOrderValue)}</b>
              trung bình/đơn
            </small>
          </div>
          <button type="button" className="revenue-action" onClick={() => openPath("/admin/stats")}>
            Xem doanh thu
          </button>
        </div>
      </div>

      <div className="overview-stat-grid">
        {managementStats.map((item) => (
          <StatCard key={item.title} {...item} onOpen={openPath} />
        ))}
      </div>

      <div className="overview-layout">
        <div className="overview-main-column">
          <RankedList
            title="Top sản phẩm được mua nhiều nhất"
            items={overview.topProducts}
            type="product"
            actionLabel="Sản phẩm"
            actionPath="/admin/product"
            onOpen={openPath}
          />
          <RankedList
            title="Top danh mục được mua nhiều nhất"
            items={overview.topCategories}
            type="category"
            actionLabel="Danh mục"
            actionPath="/admin/product/categories"
            onOpen={openPath}
          />
        </div>

        <div className="overview-side-column">
          <RankedList
            title="Top khách hàng"
            items={overview.topCustomers}
            type="customer"
            actionLabel="Khách hàng"
            actionPath="/admin/customer"
            onOpen={openPath}
          />

          <section className="overview-panel">
            <div className="panel-head">
              <div>
                <h5>Trạng thái đơn hàng</h5>
                <span>Phân bổ theo trạng thái hiện tại</span>
              </div>
              <button type="button" className="panel-action" onClick={() => openPath("/admin/order")}>
                Đơn hàng
              </button>
            </div>
            <div className="status-list">
              {overview.orderStatus.length === 0 ? (
                <div className="empty-row">Chưa có dữ liệu</div>
              ) : (
                overview.orderStatus.map((item) => (
                  <div className="status-row" key={item.Status}>
                    <div className="status-meta">
                      <span>{item.Status}</span>
                      <strong>{formatNumber(item.Total)}</strong>
                    </div>
                    <div className="status-track">
                      <span style={{ width: `${Math.max(8, (Number(item.Total || 0) / maxStatus) * 100)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <section className="overview-panel recent-orders-panel">
        <div className="panel-head">
          <div>
            <h5>Đơn hàng mới nhất</h5>
            <span>Các giao dịch vừa được ghi nhận</span>
          </div>
          <button type="button" className="panel-action" onClick={() => openPath("/admin/order")}>
            Xem tất cả
          </button>
        </div>
        <div className="recent-orders-table">
          <div className="recent-row header">
            <span>Mã đơn</span>
            <span>Khách hàng</span>
            <span>Ngày</span>
            <span>Trạng thái</span>
            <span>Tổng tiền</span>
          </div>
          {overview.recentOrders.length === 0 ? (
            <div className="recent-row empty-table-row">
              <span>Chưa có đơn hàng mới</span>
            </div>
          ) : (
            overview.recentOrders.map((order) => (
              <button
                type="button"
                className="recent-row"
                key={order.OrderID}
                onClick={() => openPath(`/admin/order/${encodeURIComponent(String(order.OrderID))}`)}
              >
                <span>{order.OrderID}</span>
                <strong>{order.CustomerName}</strong>
                <span>{order.CreatedAt || "-"}</span>
                <span className="status-pill">{order.Status}</span>
                <span>{formatVND(order.Total)}</span>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminOverviewPage;
