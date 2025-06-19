import React from "react";
import "./style.scss"; // Import file style chung

const Homepage = () => {
  // Dữ liệu cho từng nhóm menu
  const managementItems = [
    { icon: "./assets/icons/icons-product-management.png", label: "Sản phẩm" },
    { icon: "./assets/icons/icons-event.png", label: "Đơn hàng" },
    { icon: "./assets/icons/icons-product-category.png", label: "Danh mục" },
    { icon: "./assets/icons/icons-shipment.png", label: "Lô hàng" },
    { icon: "./assets/icons/icons-customer.png", label: "Khách hàng" },
    { icon: "./assets/icons/icons-account.png", label: "Tài khoản" },
  ];

  const eventItems = [
    { icon: "./assets/icons/icons-event.png", label: "Sự kiện giảm giá" },
    { icon: "./assets/icons/icons-hot-price.png", label: "Sản phẩm hot" },
    { icon: "./assets/icons/icons-sale.png", label: "Sản phẩm sale" },
  ];

  const revenueItems = [
    { icon: "./assets/icons/icons-analytics.png", label: "Tổng quan" },
    { icon: "./assets/icons/icons-revenue.png", label: "Doanh thu" },
    { icon: "./assets/icons/icons-conversion-rate.png", label: "Tỷ lệ chuyển đổi" },
  ];
  // Component con dùng để hiển thị từng mục menu (Quản lý, Quản lý sự kiện, Thống kê)
  const MenuSection = ({ title, items, className = "" }) => (
    <li className={`menu-section ${className}`}>
      {/* Phần tiêu đề với tên menu và icon mũi tên */}
        <button className="content">
          <span className="label">{title}</span>
          <img src="./assets/icons/icons-arrow-down.png" alt="arrow down" />
        </button>
      {/* Danh sách các item trong menu */}
      <ul className="list-child">
        {items.map((item, idx) => (
          <li className="child" key={idx}>
            <button>
              <img src={item.icon} alt={item.label} />
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </li>
  );
  return (
    <div className="row h-100 homepage">
      {/* Thanh menu bên trái với nền màu xanh thành Bootstrap (bg-success) */}
      <div className="menu-panelcol-2 p-0">
        <div className="app-sidebar">
          <ul className="vertical-nav-menu metismenu">
            <li className="app-sidebar__heading">Menu</li>
            <li className="btn_top">
              <button>
                <a href="/">
                  <img src="./assets/icons/icons8-home-50.png" alt="Trang chủ" />
                  <span>Trang chủ</span></a>
              </button>
            </li>

            {/* Các nhóm menu được render qua component MenuSection */}
            <MenuSection title="Quản lý" items={managementItems} className="managementItems" />
            <MenuSection title="Quản lý sự kiện" items={eventItems} className="eventItems" />
            <MenuSection title="Thống kê" items={revenueItems} className="revenueItems" />

          </ul>
        </div>
      </div>

      {/* Khu vực nội dung bên phải (chiếm 10 cột) */}
      <div className="col-10">{/* Nội dung bên phải sẽ hiển thị ở đây */}</div>

    </div>
  );
};

export default Homepage;
