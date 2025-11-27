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

const OrderPage = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null); // Đơn hàng chờ hiển thị chi tiết
  const [isCollapsed, setIsCollapsed] = useState(false); // Trạng thái co bảng

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


  // ---------------- helper parse/format ----------------
  const parsePrice = (p) => Number(String(p).replace(/[^\d]/g, "")) || 0;
  const formatPrice = (v) => (Number(v) || 0).toLocaleString("vi-VN") + "₫";

  //======================== Lọc theo search + trạng thái================== 
  const filteredOrders = ordersData
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

      return matchKeyword && matchStatus;
    })
    // Bước 2: sắp xếp dữ liệu đã lọc
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Ngày gần nhất lên đầu


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

      <div className="order-flex-container">
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
                <li className="column order-date">Ngày đặt</li>
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
                  <ul className="order-row" key={order.id}>
                    <li className="column number">{idx + 1}</li>
                    <li className="column order-id">{order.id}</li>
                    <li className="column customer-name">{order.customer}</li>
                    <li className="column order-date">{order.date}</li>
                    <li className="column total-amount">{order.total}</li>
                    {/* 🔹 Hiển thị trạng thái với màu sắc khác nhau */}
                    {/* Gán thêm class khác nhau thuận tiện css màu cho từng trạng thái */}
                    <li
                      className={
                        "column status status-pill " +
                        (order.status === "Hoàn thành"
                          ? "status--hoan-thanh"
                          : order.status === "Đang xử lý"
                          ? "status--dang-xu-ly"
                          : order.status === "Chờ xác nhận"
                          ? "status--cho-xac-nhan"
                          : order.status === "Đang giao"
                          ? "status--dang-giao"
                          : order.status === "Đã giao"
                          ? "status--da-giao"
                          : order.status === "Đã hủy"
                          ? "status--da-huy"
                          : order.status === "Trả hàng"
                          ? "status--tra-hang"
                          : "")
                      }
                    >
                      {order.status}
                    </li>

                    <li className="column actions">
                      <button
                        className="btn-view"
                        onClick={() => handleViewDetail(order)}
                        disabled={!!pendingOrder}
                      >
                        👁 Xem
                      </button>
                      {canEdit(order.status) && (
                        <button className="btn-edit">✏️ Sửa</button>
                      )}

                      <button className="btn-delete">🗑 Xóa</button>
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
                <h3>📝 Chi tiết đơn hàng</h3>
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
                <div style={{ textAlign: "end" }} className="total-items">
                  Tổng số món: <strong>{totalItems}</strong>
                </div>
                <div style={{ textAlign: "end" }} className="total-price">
                  Tổng tiền: <strong>{formatPrice(totalPrice)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPage;
