import React, { useState } from "react";
import "./theme.scss";

const navItems = [
  { icon: "icons8-menu-50.png", label: "Tất cả", className: "mega_menu" },
  { icon: "icons8-chat.gif", label: "Tin nhắn", className: "chat" },
  { icon: "icons8-bell.gif", label: "Thông báo", className: "notification" },
];

const Header = () => {


  const [isActive, setIsActive] = useState(false);

const toggleSearch = () => {
  setIsActive((prev) => !prev);
};

  return (
    <header>
      <div className="container">
        {/* Logo */}
        <a href="/" className="logo">
          <img src="/assets/images/logo.png" alt="Logo" />
        </a>

        {/* Search */}
        <div className="search-container">
          <div className={`search-wrapper ${isActive ? "active" : ""}`}>
            <div className="search">
              <input type="text" placeholder="Tìm kiếm..." className="input_search" />
              <button className="btn_search" onClick={toggleSearch}>
                <img src="./assets/icons/search-icon.png" alt="Search" className="icon_search" />
              </button>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="function_button">
          <ul className="nav">
            {navItems.map(({ icon, label, className }, i) => (
              <li key={i}>
                <button className={className}>
                  <img src={`./assets/icons/${icon}`} alt={label} />
                  {label}
                  <img src="./assets/icons/icons-arrow-down.png" alt="arrow" className="arrow-down" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Admin */}
        <div className="admin">
          <button className="btn_admin">
            <img src="./assets/icons/icons-admin.png" alt="Admin" className="icon_admin" />
          </button>
          <span className="name_admin">Tên ADMIN</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
