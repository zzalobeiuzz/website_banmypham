import React from "react";
import "./theme.scss";

// Danh sách các mục điều hướng (menu) ở giữa header
const navItems = [
  { icon: "icons8-menu-50.png", label: "Tất cả", className: "mega_menu" },
  { icon: "icons8-chat.gif", label: "Tin nhắn", className: "chat" },
  { icon: "icons8-bell.gif", label: "Thông báo", className: "notification" },
];

// Component Header hiển thị phần đầu trang
const Header = () => (
  <header className="bg-light border-bottom">
    <div className="container d-flex justify-content-between align-items-center">
      {/* Logo thương hiệu */}
      <a href="/" className="logo me-3">
        <img src="/assets/images/logo.png" alt="Logo" style={{ width: 80 }} />
      </a>

      {/* Phần giữa: ô tìm kiếm + menu điều hướng */}

        {/* Ô tìm kiếm */}
        <div className="search">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="input_search"
            // style={{ display: "none" }}
          />
          <button className="btn_search">
            <img
              src="./assets/icons/search-icon.png"
              alt="Search"
              className="icon_search"
            />
          </button>
        </div>
        <div className="function_button">
        {/* Menu điều hướng trung tâm: Tất cả, Tin nhắn, Thông báo */}
        <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
          {navItems.map(({ icon, label, className }, i) => (
            <li key={i}>
              <button className={className}>
                <img src={`./assets/icons/${icon}`} alt={label} />
                {label}
                <img
                  src={`./assets/icons/icons-arrow-down.png`}
                  alt={label}
                  className="arrow-down"
                />
              </button>
            </li>
          ))}
        </ul>
        <div></div>
     

      {/* Phần quản trị (admin): nút và tên admin */}
      <div className="admin">
        <button className="btn_admin">
          <img
            src="./assets/icons/icons-admin.png"
            alt="Admin"
            className="icon_admin"
          />
        </button>
        <span className="name_admin">Tên ADMIN</span>
      </div>
    </div>
  </header>
);

export default Header;
