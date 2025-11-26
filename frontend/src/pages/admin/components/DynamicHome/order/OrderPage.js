import React, { useState, useRef } from "react";
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
      { name: "Toner", qty: 1, price: "350,000₫" },
      { name: "Serum", qty: 1, price: "500,000₫" },
      { name: "Toner", qty: 1, price: "350,000₫" },
      { name: "Serum", qty: 1, price: "500,000₫" },
      { name: "Toner", qty: 1, price: "350,000₫" },
      { name: "Serum", qty: 1, price: "500,000₫" },
      
    ],
    address: "456 Đường B, Quận 3, TP.HCM",
    phone: "0912345678",
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

  // Khi ấn "Xem"
  const handleViewDetail = (order) => {
    // nếu đang trong transition chờ panel thu, không làm gì
    if (pendingOrder) return;

    // nếu panel đã thu nhỏ (isCollapsed=true)
    // - nếu đang hiển thị selectedOrder thì thay ngay bằng order mới
    // - nếu chưa có selectedOrder (đang transit), đặt vào hàng chờ
    if (isCollapsed) {
      if (selectedOrder) {
        setSelectedOrder(order);
      } else {
        setPendingOrder(order);
      }
      return;
    }

    // nếu panel đang ở trạng thái mở, bắt đầu thu lại và lưu hàng chờ
    setPendingOrder(order);
    setIsCollapsed(true);
  };

  // Khi bảng co xong (transitionEnd), mới hiện chi tiết
  const handleTransitionEnd = (e) => {
    // Chỉ xử lý khi đúng element và đúng trạng thái co
    if (isCollapsed && pendingOrder && e.propertyName === "max-width") {
      setSelectedOrder(pendingOrder);
      setPendingOrder(null);
    }
    // Khi mở rộng xong (sau khi đóng chi tiết), reset state
    if (!isCollapsed && !selectedOrder && e.propertyName === "max-width") {
      // Đảm bảo không làm gì thêm
    }
  };

  // Khi đóng panel chi tiết
  const handleCloseDetail = () => {
    setSelectedOrder(null); // Ẩn bảng detail trước
    setTimeout(() => {
      setIsCollapsed(false); // Sau đó mở rộng lại bảng
    }, 50); // Đợi detail biến mất rồi mới mở rộng
  };

  // ---------------- helper parse/format (thêm vào trong component, trước return) ----------------
  const parsePrice = (p) => Number(String(p).replace(/[^\d]/g, "")) || 0;
  const formatPrice = (v) => (Number(v) || 0).toLocaleString("vi-VN") + "₫";

  // Tổng số món & tổng tiền (tính ở mức component, dùng trong tbody và tfoot)
  const totalItems = selectedOrder
    ? selectedOrder.details.reduce((sum, it) => sum + (it.qty || 0), 0)
    : 0;
  const totalPrice = selectedOrder
    ? selectedOrder.details.reduce((s, it) => s + parsePrice(it.price) * (it.qty || 0), 0)
    : 0;

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
          {/* Bộ lọc trạng thái đơn hàng */}
          <div className="order-status-filters">
            <button className="filter-button">Tất cả</button>
            <button className="filter-button">Chờ xác nhận</button>
            <button className="filter-button">Đang giao</button>
            <button className="filter-button">Đã giao</button>
            <button className="filter-button">Đã hủy</button>
            <button className="filter-button">Trả hàng</button>
            <button className="filter-button">Hoàn thành</button>
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
              {ordersData.map((order, idx) => (
                <ul className="order-row" key={order.id}>
                  <li className="column number">{idx + 1}</li>
                  <li className="column order-id">{order.id}</li>
                  <li className="column customer-name">{order.customer}</li>
                  <li className="column order-date">{order.date}</li>
                  <li className="column total-amount">{order.total}</li>
                  <li className="column status">{order.status}</li>
                  <li className="column actions">
                    {/* Nút xem chi tiết */}
                    <button
                      className="btn-view"
                      onClick={() => handleViewDetail(order)}
                      disabled={!!pendingOrder}
                    >
                      👁 Xem
                    </button>
                    <button className="btn-edit">✏️ Sửa</button>
                    <button className="btn-delete">🗑 Xóa</button>
                  </li>
                </ul>
              ))}
            </div>
          </div>
        </div>

        {/* Chi tiết đơn hàng (hiển thị bên phải) */}
        {selectedOrder && (
          <div className="order-detail-section">
            <div className="order-detail">
              <h3>📝 Chi tiết đơn hàng</h3>
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

              {/* ---------------- thay phần <ul>... bằng table ---------------- */}
              <div className="order-products-table-wrapper">
                <table className="order-products-table">
                  {/* đặt colgroup để ưu tiên width cho cột tên sản phẩm */}
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
               {/* ---------------- totals moved OUTSIDE the table ---------------- */}
                <div className="order-products-totals">
                  <div style={{textAlign:"end"}}className="total-items">Tổng số món: <strong>{totalItems}</strong></div>
                  <div style={{textAlign:"end"}}className="total-price">Tổng tiền: <strong>{formatPrice(totalPrice)}</strong></div>
                </div>
              <button onClick={handleCloseDetail}>⬅️ Đóng</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPage;
