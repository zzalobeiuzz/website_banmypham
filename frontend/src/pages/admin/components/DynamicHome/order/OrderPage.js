import React, { useState } from "react";
import ToolBar from "../../ToolBar";
import "./style.scss";

const ordersData = [
  {
    id: "DH001",
    customer: "Nguyễn Văn A",
    date: "2025-09-25",
    total: "1,200,000₫",
    status: "Đang xử lý",
    details: [
      { name: "Sữa rửa mặt", qty: 2, price: "200,000₫" },
      { name: "Kem chống nắng", qty: 1, price: "800,000₫" },
    ],
    address: "123 Đường A, Quận 1, TP.HCM",
    phone: "0901234567",
  },
  {
    id: "DH002",
    customer: "Trần Thị B",
    date: "2025-09-24",
    total: "850,000₫",
    status: "Hoàn thành",
    details: [
      { name: "Toner", qty: 1, price: "350,000₫" },
      { name: "Serum", qty: 1, price: "500,000₫" },
    ],
    address: "456 Đường B, Quận 3, TP.HCM",
    phone: "0912345678",
  },
  {
    id: "DH003",
    customer: "Lê Văn C",
    date: "2025-09-26",
    total: "2,300,000₫",
    status: "Đang giao",
    details: [
      { name: "Kem dưỡng ẩm", qty: 2, price: "600,000₫" },
      { name: "Mặt nạ", qty: 3, price: "350,000₫" },
    ],
    address: "789 Đường C, Quận 5, TP.HCM",
    phone: "0923456789",
  },
  {
    id: "DH004",
    customer: "Phạm Thị D",
    date: "2025-09-27",
    total: "1,500,000₫",
    status: "Chờ xác nhận",
    details: [
      { name: "Tẩy trang", qty: 1, price: "150,000₫" },
      { name: "Kem chống nắng", qty: 2, price: "650,000₫" },
    ],
    address: "321 Đường D, Quận 7, TP.HCM",
    phone: "0934567890",
  },
  {
    id: "DH005",
    customer: "Ngô Văn E",
    date: "2025-09-28",
    total: "900,000₫",
    status: "Đã hủy",
    details: [{ name: "Sữa tắm", qty: 3, price: "300,000₫" }],
    address: "654 Đường E, Quận 2, TP.HCM",
    phone: "0945678901",
  },
  {
    id: "DH006",
    customer: "Trần Văn F",
    date: "2025-09-29",
    total: "1,100,000₫",
    status: "Trả hàng",
    details: [{ name: "Serum dưỡng trắng", qty: 1, price: "1,100,000₫" }],
    address: "987 Đường F, Quận 9, TP.HCM",
    phone: "0956789012",
  },
];

const COLLAPSED_WIDTH = "70%";
const EXPANDED_WIDTH = "100%";
const TRANSITION_TIME = 350; // ms
const WEEK_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const ORDER_STATUSES = [
  "Chờ xác nhận",
  "Đang xử lý",
  "Đang giao",
  "Đã giao",
  "Hoàn thành",
  "Đã hủy",
  "Trả hàng",
];

const OrderPage = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [orders, setOrders] = useState(ordersData);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null); // Đơn hàng chờ hiển thị chi tiết
  const [isCollapsed, setIsCollapsed] = useState(false); // Trạng thái co bảng
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [openStatusMenuOrderId, setOpenStatusMenuOrderId] = useState(null);

  // sort state cho cột Ngày đặt: 'asc' | 'desc'
  const [dateSort, setDateSort] = useState("desc"); // mặc định luôn hiển thị (giảm dần)
  const [dateFilter, setDateFilter] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // 🔹 state filter theo trạng thái
  const [filterStatus, setFilterStatus] = useState("Tất cả");

  // Danh sách trạng thái dùng cho nút filter
  const statusFilters = [
    "Tất cả",
    "Chờ xác nhận",
    "Đang giao",
    "Đã giao",
    "Đã hủy",
    "Trả hàng",
    "Hoàn thành",
    "Đang xử lý", // thêm trạng thái thực tế có trong ordersData
  ];

  // ==========Chỉ cho phép sửa những đơn chưa giao, chưa hoàn thành, chưa trả hàng==================
  const canEdit = (status) => {
    const blockedStatuses = ["Đang giao", "Hoàn thành", "Trả hàng"];
    return !blockedStatuses.includes(status);
  };

  // Trả về class màu tương ứng cho từng trạng thái để tái sử dụng ở nhiều chỗ.
  const getStatusClass = (status) => {
    if (status === "Hoàn thành") return "status--hoan-thanh";
    if (status === "Đang xử lý") return "status--dang-xu-ly";
    if (status === "Chờ xác nhận") return "status--cho-xac-nhan";
    if (status === "Đang giao") return "status--dang-giao";
    if (status === "Đã giao") return "status--da-giao";
    if (status === "Đã hủy") return "status--da-huy";
    if (status === "Trả hàng") return "status--tra-hang";
    return "";
  };

  // ---------------- helper parse/format ----------------
  const parsePrice = (p) => Number(String(p).replace(/[^\d]/g, "")) || 0;
  const formatPrice = (v) => (Number(v) || 0).toLocaleString("vi-VN") + "₫";
  const originalStatusById = ordersData.reduce((acc, order) => {
    acc[order.id] = order.status;
    return acc;
  }, {});

  //======================== Lọc theo search + trạng thái==================
  const filteredOrders = orders
    .filter((order) => {
      // Bước 1: lọc dữ liệu
      // lọc theo keyword
      const keyword = searchKeyword.trim().toLowerCase();
      const matchKeyword =
        !keyword ||
        order.id.toLowerCase().includes(keyword) ||
        order.customer.toLowerCase().includes(keyword);

      // lọc theo trạng thái
      const matchStatus =
        filterStatus === "Tất cả" || order.status === filterStatus;
      const matchDate = !dateFilter || order.date === dateFilter;

      return matchKeyword && matchStatus && matchDate;
    })
    // Bước 2: sắp xếp dữ liệu đã lọc theo dateSort (asc/desc)
    .sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      return dateSort === "asc" ? ta - tb : tb - ta;
    }); // sắp xếp theo dateSort

  const pad2 = (n) => String(n).padStart(2, "0");

  const toIsoDate = (dateObj) => {
    return `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(
      dateObj.getDate()
    )}`;
  };

  const formatDateLabel = (isoDate) => {
    if (!isoDate) return "Chọn ngày";
    const [y, m, d] = isoDate.split("-");
    if (!y || !m || !d) return "Chọn ngày";
    return `${d}/${m}/${y}`;
  };

  const handleToggleCalendar = () => {
    if (dateFilter) {
      const [y, m] = dateFilter.split("-").map(Number);
      if (y && m) {
        setCalendarMonth(new Date(y, m - 1, 1));
      }
    }
    setIsCalendarOpen((prev) => !prev);
  };

  const handleSelectDate = (day) => {
    const pickedDate = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day
    );
    setDateFilter(toIsoDate(pickedDate));
    setIsCalendarOpen(false);
  };

  const changeMonth = (step) => {
    setCalendarMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + step, 1)
    );
  };

  const daysInMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayOffset = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  ).getDay();

  const applyStatusChange = (orderId, nextStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: nextStatus } : order
      )
    );

    setSelectedOrder((prev) =>
      prev && prev.id === orderId ? { ...prev, status: nextStatus } : prev
    );
  };

  // Mở/tắt menu dropdown trạng thái của từng đơn hàng.
  const handleStatusClick = (event, orderId) => {
    event.stopPropagation();
    setOpenStatusMenuOrderId((prev) => (prev === orderId ? null : orderId));
  };

  // Người dùng chọn một trạng thái cụ thể từ dropdown, không dùng cơ chế vòng lặp.
  const handleChooseStatus = (event, order, nextStatus) => {
    event.stopPropagation();
    setOpenStatusMenuOrderId(null);

    if (nextStatus === order.status) return;

    const originalStatus = originalStatusById[order.id];

    if (nextStatus !== originalStatus) {
      setPendingStatusChange({
        orderId: order.id,
        fromStatus: order.status,
        nextStatus,
      });
      return;
    }

    applyStatusChange(order.id, nextStatus);
  };

  const handleConfirmStatusChange = () => {
    if (!pendingStatusChange) return;
    applyStatusChange(
      pendingStatusChange.orderId,
      pendingStatusChange.nextStatus
    );
    setPendingStatusChange(null);
  };

  const handleCancelStatusChange = () => {
    setPendingStatusChange(null);
  };

  //================== Tổng số món & tổng tiền (dùng cho detail)==================
  const totalItems = selectedOrder
    ? selectedOrder.details.reduce((sum, it) => sum + (it.qty || 0), 0)
    : 0;
  const totalPrice = selectedOrder
    ? selectedOrder.details.reduce(
        (s, it) => s + parsePrice(it.price) * (it.qty || 0),
        0
      )
    : 0;

  //================== Khi ấn "Xem"==================
  const handleViewDetail = (order) => {
    if (pendingOrder) return;
    setIsCalendarOpen(false);
    setOpenStatusMenuOrderId(null);

    if (isCollapsed) {
      if (selectedOrder) {
        setSelectedOrder(order);
      } else {
        setPendingOrder(order);
      }
      return;
    }

    setPendingOrder(order);
    setIsCollapsed(true);
  };

  //==================  Khi bảng co xong (transitionEnd), mới hiện chi tiết==================
  const handleTransitionEnd = (e) => {
    if (isCollapsed && pendingOrder && e.propertyName === "max-width") {
      setSelectedOrder(pendingOrder);
      setPendingOrder(null);
    }
  };

  //================== Khi đóng panel chi tiết==================
  const handleCloseDetail = () => {
    setSelectedOrder(null);
    setTimeout(() => {
      setIsCollapsed(false);
    }, 50);
  };

  return (
    <div className="order-page">
      <ToolBar title="Đơn hàng" onSearchChange={setSearchKeyword} />

      <div className={`order-flex-container ${selectedOrder ? "show-detail" : ""}`}>
        {/* Danh sách đơn hàng */}
        <div
          className="order-list-section"
          style={{
            maxWidth: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
            transition: `max-width ${TRANSITION_TIME}ms cubic-bezier(0.23, 1, 0.32, 1)`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {/* 🔹 Bộ lọc trạng thái đơn hàng */}
          <div className="order-status-filters">
            {statusFilters.map((status) => (
              // Một nút cho mỗi trạng thái trong mảng statusFilters
              <button
                key={status}
                // thêm class "filter-button--active" nếu trạng thái đang chọn trùng với status
                className={
                  "filter-button" +
                  (filterStatus === status ? " filter-button--active" : "")
                }
                // khi click: set state filterStatus -> sẽ làm filteredOrders cập nhật
                onClick={() => setFilterStatus(status)}
              >
                {status /* hiển thị tên trạng thái trên nút */}
              </button>
            ))}
          </div>

          {/* Bảng danh sách đơn hàng */}
          <div className="order-list">
            <div className="header-row">
              <ul className="header-columns">
                <li className="column number">STT</li>
                <li className="column order-id">Mã đơn hàng</li>
                <li className="column customer-name">Tên khách hàng</li>
                <li className="column order-date">
                  <div className="date-sort">
                    <span className="date-label">Ngày đặt</span>
                    <span
                      className={
                        "sort-icon asc" +
                        (dateSort === "asc" ? " active" : "")
                      }
                      onClick={() => setDateSort("asc")}
                      title="Sắp xếp theo ngày xa nhất"
                    >
                      ▲
                    </span>
                    <span
                      className={
                        "sort-icon desc" +
                        (dateSort === "desc" ? " active" : "")
                      }
                      onClick={() => setDateSort("desc")}
                      title="Sắp xếp theo ngày gần nhất"
                    >
                      ▼
                    </span>
                  </div>
                  {!selectedOrder && (
                    <>
                      <button
                        type="button"
                        className="btn-date-picker"
                        onClick={handleToggleCalendar}
                      >
                        <span className="calendar-icon" aria-hidden="true">📅</span>
                        <span>{formatDateLabel(dateFilter)}</span>
                      </button>
                      {dateFilter && (
                        <button
                          type="button"
                          className="btn-clear-date"
                          onClick={() => setDateFilter("")}
                          title="Bỏ lọc ngày"
                        >
                          X
                        </button>
                      )}
                    </>
                  )}

    
                  {!selectedOrder && isCalendarOpen && (
                    <div className="calendar-popover" role="dialog" aria-label="Chọn ngày">
                      <div className="calendar-header">
                        <button type="button" onClick={() => changeMonth(-1)}>
                          ‹
                        </button>
                        <span>
                          {calendarMonth.toLocaleString("vi-VN", {
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <button type="button" onClick={() => changeMonth(1)}>
                          ›
                        </button>
                      </div>

                      <div className="calendar-grid calendar-weekdays">
                        {WEEK_DAYS.map((wd) => (
                          <span key={wd}>{wd}</span>
                        ))}
                      </div>

                      <div className="calendar-grid calendar-days">
                        {Array.from({ length: firstDayOffset }).map((_, i) => (
                          <span key={`empty-${i}`} className="empty" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const dateIso = toIsoDate(
                            new Date(
                              calendarMonth.getFullYear(),
                              calendarMonth.getMonth(),
                              day
                            )
                          );
                          const isSelected = dateFilter === dateIso;

                          return (
                            <button
                              type="button"
                              key={dateIso}
                              className={isSelected ? "selected" : ""}
                              onClick={() => handleSelectDate(day)}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  
                </li>
                <li className="column total-amount">Tổng tiền</li>
                <li className="column status">Trạng thái</li>
                <li className="column actions">Hành động</li>
              </ul>
            </div>
            <div className="order-rows">
              {filteredOrders.length === 0 ? (
                <div className="no-orders">Không có đơn hàng phù hợp</div>
              ) : (
                filteredOrders.map((order, idx) => (
                  <ul
                    className={`order-row ${selectedOrder?.id === order.id ? "is-active" : ""}`}
                    key={order.id}
                    onClick={() => handleViewDetail(order)}
                  >
                    <li className="column number">{idx + 1}</li>
                    <li className="column order-id">{order.id}</li>
                    <li className="column customer-name">{order.customer}</li>
                    <li className="column order-date">{order.date}</li>
                    <li className="column total-amount">{order.total}</li>
                    {/* 🔹 Hiển thị trạng thái với màu sắc khác nhau */}
                    {/* Gán thêm class khác nhau thuận tiện css màu cho từng trạng thái */}
                    <li className="column status status-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`status-pill status-clickable ${getStatusClass(order.status)}`}
                        onClick={(e) => handleStatusClick(e, order.id)}
                        title="Bấm để chọn trạng thái"
                      >
                        {order.status}
                      </button>

                      {openStatusMenuOrderId === order.id && (
                        <div className="status-dropdown" role="menu" aria-label="Chọn trạng thái">
                          {ORDER_STATUSES.map((status) => (
                            <button
                              type="button"
                              key={status}
                              className={`status-option ${status === order.status ? "active" : ""}`}
                              onClick={(e) => handleChooseStatus(e, order, status)}
                            >
                              <span className={`status-pill ${getStatusClass(status)}`}>{status}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </li>

                    <li className="column actions">
                      {canEdit(order.status) && (
                        <button className="btn-edit" onClick={(e) => e.stopPropagation()}>
                          ✏️ Sửa
                        </button>
                      )}

                      <button className="btn-delete" onClick={(e) => e.stopPropagation()}>
                        🗑 Xóa
                      </button>
                    </li>
                  </ul>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chi tiết đơn hàng (bên phải) */}
        {selectedOrder && (
          <div className="order-detail-section">
            <div className="order-detail">
              <div className="order-detail-header">
                {/* <h3>📝 Chi tiết đơn hàng</h3> */}
                <button
                  className="btn-close"
                  onClick={handleCloseDetail}
                  aria-label="Đóng"
                >
                  ✖
                </button>
              </div>
              <p>
                <strong>🆔 Mã đơn:</strong> {selectedOrder.id}
              </p>
              <p>
                <strong>👤 Khách hàng:</strong> {selectedOrder.customer}
              </p>
              <p>
                <strong>📅 Ngày đặt:</strong> {selectedOrder.date}
              </p>
              <p>
                <strong>🔖 Trạng thái:</strong> {selectedOrder.status}
              </p>
              <p>
                <strong>🏠 Địa chỉ:</strong> {selectedOrder.address}
              </p>
              <p>
                <strong>📞 SĐT:</strong> {selectedOrder.phone}
              </p>
              <p>
                <strong>💰 Tổng tiền:</strong> {selectedOrder.total}
              </p>

              <strong>🛒 Sản phẩm:</strong>
              <div className="order-products-table-wrapper">
                <table className="order-products-table">
                  <colgroup>
                    <col style={{ width: "60%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "28%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Tên Sản phẩm</th>
                      <th style={{ textAlign: "center" }}>Số lượng</th>
                      <th style={{ textAlign: "right" }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.details.map((item, i) => {
                      const itemPrice = parsePrice(item.price);
                      const itemTotal = itemPrice * (item.qty || 0);
                      return (
                        <tr key={i}>
                          <td title={item.name} className="product-name-cell">
                            {item.name}
                          </td>
                          <td style={{ textAlign: "center" }}>{item.qty}</td>
                          <td style={{ textAlign: "right" }}>
                            {formatPrice(itemTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="order-products-totals">
                <div style={{ textAlign: "center" }} className="total-items">
                  Tổng số món: <strong>{totalItems}</strong>
                </div>
                <div style={{ textAlign: "center" }} className="total-price">
                  Tổng tiền: <strong>{formatPrice(totalPrice)}</strong>
                </div>

                {/* Nút in — xử lý in sẽ được implement ở chỗ khác */}
                <button
                  type="button"
                  className="btn-print"
                  data-order-id={selectedOrder.id}
                  onClick={() => {
                    /* placeholder: in hóa đơn sẽ xử lý ở nơi khác */
                  }}
                >
                  🖨 In
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {pendingStatusChange && (
        <div className="status-confirm-overlay" role="dialog" aria-modal="true">
          <div className="status-confirm-modal">
            <h4>Xác nhận đổi trạng thái</h4>
            <p>Bạn có muốn thay đổi trạng thái đơn hàng?</p>
            <p>
              <strong>{pendingStatusChange.fromStatus}</strong> {"->"}{" "}
              <strong>{pendingStatusChange.nextStatus}</strong>
            </p>
            <div className="status-confirm-actions">
              <button type="button" onClick={handleCancelStatusChange}>
                Không
              </button>
              <button type="button" onClick={handleConfirmStatusChange}>
                Có, thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
