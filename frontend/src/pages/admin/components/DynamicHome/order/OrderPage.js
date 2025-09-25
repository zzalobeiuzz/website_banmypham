import React, { useState } from "react";
import ToolBar from "../../ToolBar"; // 🔍 Toolbar search/filter
import "./style.scss";
const OrderPage = () => {
  const [searchKeyword, setSearchKeyword] = useState(""); // 🔍 Keyword search
  return (
    <>
      {/* 🔍 Toolbar tìm kiếm */}
      <ToolBar title="Đơn hàng" onSearchChange={setSearchKeyword} />

      {/* Hiển thị danh sách đơn hàng ở đây */}
      <div className="order-page">
        <div className="order-status-filters">
          {/* Các bộ lọc trạng thái đơn hàng */}
          <button className="filter-button">Tất cả</button>
          <button className="filter-button">Chờ xác nhận</button>
          <button className="filter-button">Đang giao</button>
          <button className="filter-button">Đã giao</button>
          <button className="filter-button">Đã hủy</button>
          <button className="filter-button">Trả hàng</button>
          <button className="filter-button">Hoàn thành</button>
        </div>
        <div className="order-list">
          <div className="header-row">
            <ul className="header-columns">
              <li className="column column--sortable number">STT</li>
              <li className="column column--sortable order-id">Mã đơn hàng</li>
              <li className="column column--sortable customer-name">
                Tên khách hàng
              </li>
              <li className="column column--sortable order-date">Ngày đặt</li>
              <li className="column column--sortable total-amount">
                Tổng tiền
              </li>
              <li className="column column--dropdown status">Trạng thái</li>
              <li className="column actions">Hành động</li>
            </ul>
          </div>
          <div className="order-rows">
            <ul className="order-row">
              <li className="column number">1</li>
              <li className="column order-id">DH001</li>
              <li className="column customer-name">Nguyễn Văn A</li>
              <li className="column order-date">2025-09-25</li>
              <li className="column total-amount">1,200,000₫</li>
              <li className="column status">Đang xử lý</li>
              <li className="column actions">
                <button className="btn-view">👁 Xem</button>
                <button className="btn-edit">✏️ Sửa</button>
                <button className="btn-delete">🗑 Xóa</button>
              </li>
            </ul>

            <ul className="order-row">
              <li className="column number">2</li>
              <li className="column order-id">DH002</li>
              <li className="column customer-name">Trần Thị B</li>
              <li className="column order-date">2025-09-24</li>
              <li className="column total-amount">850,000₫</li>
              <li className="column status">Hoàn thành</li>
              <li className="column actions">
                <button className="btn-view">👁 Xem</button>
                <button className="btn-edit">✏️ Sửa</button>
                <button className="btn-delete">🗑 Xóa</button>
              </li>
            </ul>
          </div>
        </div>
        <div className="sidebar">{/* Chi tiết đơn hàng khi chọn */}</div>
      </div>
    </>
  );
};

export default OrderPage;
