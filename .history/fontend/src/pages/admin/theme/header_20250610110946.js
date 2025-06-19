import React from "react";
import "./theme.scss";

const navItems = [
  { icon: "icons8-menu-50.png", label: "Tất cả", className: "mega_menu" },
  { icon: "icons8-chat.gif", label: "Tin nhắn", className: "chat" },
  { icon: "icons8-bell.gif", label: "Thông báo", className: "notification" },
];

const Header = () => (
  <header className="bg-light border-bottom">
    <div className="container d-flex justify-content-between align-items-center">
      <a href="/" className="logo me-3">
        <img src="/assets/images/logo.png" alt="Logo" style={{ width: 80 }} />
      </a>

      <div className="search">
        <button className="btn_search">
          <img src="./assets/icons/search-icon.png" alt="Search" className="icon_search" />
        </button>
        <input type="text" placeholder="Tìm kiếm..." className="input_search" />
      </div>

      <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
        {navItems.map(({ icon, label, className }, i) => (
          <li key={i}>
            <button className={className}>
              <img src={`./assets/icons/${icon}`} alt={label} className="icon_search" />
              {label}
            </button>
          </li>
        ))}
      </ul>

      <div className="admin">
        <button className="btn_admin">
          <img src="./assets/icons/icons-admin.png" alt="Admin" className="icon_admin" />
        </button>
        <span className="name_admin">Tên ADMIN</span>
      </div>
    </div>
  </header>
);

export default Header;
