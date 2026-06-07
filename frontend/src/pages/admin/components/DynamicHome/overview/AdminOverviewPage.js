import React, { useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaChartLine,
  FaClipboardList,
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

const AdminOverviewPage = () => {
  const navigate = useNavigate();
  const { request, loading } = useHttp();
  const [overview, setOverview] = useState(emptyOverview);

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

  if (loading && !overview.counts.Products) {
    return <div className="admin-overview-page">Đang tải tổng quan...</div>;
  }

  return (
    <div className="admin-overview-page">
      <div className="overview-header">
        <div className="overview-title-block">
          <span className="overview-eyebrow">Dashboard</span>
          <h4>Tổng quan quản trị</h4>
          <p>Theo dõi nhanh quy mô dữ liệu, nhóm bán chạy và khách hàng nổi bật.</p>
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
