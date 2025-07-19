import React, { useState } from "react";
import "./theme.scss";
import { UPLOAD_BASE } from "../../constants";

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

  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <header>
      <div className="container header-shadow">
        {/* Logo */}
        <a href="/" className="logo">
          <img
            src={`${UPLOAD_BASE}/assets/images/logo-removebg.png`}
            alt="Logo"
            loading="lazy"
          />
        </a>

        {/* Search */}
        <div className="search-container">
          <div className={`search-wrapper ${isActive ? "active" : ""}`}>
            <div className="search">
              <input
                type="text"
                placeholder="Tìm kiếm chức năng..."
                className="input_search"
              />
              <button
                className="btn_search"
                onClick={() => {
                  if (!isActive) toggleSearch();
                }}
              >
                <img
                  src={`${UPLOAD_BASE}/assets/icons/search-icon.png`}
                  alt="Search"
                  className="icon_search"
                  loading="lazy"
                />
              </button>
            </div>
          </div>
          <button
            className={`close ${isActive ? "active" : ""}`}
            onClick={toggleSearch}
            aria-label="Close search"
          />
        </div>

        {/* Menu */}
        <div className="function_button">
          <ul className="nav">
            {navItems.map(({ icon, label, className }, i) => (
              <li key={i}>
                <button className={className}>
                  <img
                    src={`${UPLOAD_BASE}/assets/icons/${icon}`}
                    alt={label}
                    loading="lazy"
                  />
                  {label}
                  <img
                    src={`${UPLOAD_BASE}/assets/icons/icons-arrow-down.png`}
                    alt="arrow"
                    className="arrow-down"
                    loading="lazy"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Admin */}
        <div className="admin">
          <button className="btn_admin">
            <img
              src={`${UPLOAD_BASE}/icons/icons-admin.png`}
              alt="Admin"
              className="icon_admin"
              loading="lazy"
            />
          </button>
          <span className="name_admin">{user?.name || "Admin"}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
