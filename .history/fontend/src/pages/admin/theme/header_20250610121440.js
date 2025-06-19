import React, { useEffect, useRef, useState } from "react";
import "./theme.scss";

// Danh sách các mục điều hướng hiển thị ở giữa header
const navItems = [
  { icon: "icons8-menu-50.png", label: "Tất cả", className: "mega_menu" },
  { icon: "icons8-chat.gif", label: "Tin nhắn", className: "chat" },
  { icon: "icons8-bell.gif", label: "Thông báo", className: "notification" },
];

const Header = () => {
  const [showInput, setShowInput] = useState(false); // Trạng thái ẩn/hiện ô input tìm kiếm
  const wrapperRef = useRef(null); // Ref dùng để xác định click bên ngoài ô tìm kiếm

  // Hàm bật/tắt ô input tìm kiếm khi click vào nút search
  const toggleSearch = () => setShowInput((prev) => !prev);

  // useEffect để ẩn ô input khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Nếu click nằm ngoài phần tử wrapper, ẩn ô input
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowInput(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-light border-bottom">
      <div className="container d-flex justify-content-between align-items-center">
        
        {/* Logo thương hiệu */}
        <a href="/" className="logo me-3">
          <img src="/assets/images/logo.png" alt="Logo" style={{ width: 80 }} />
        </a>

        {/* Phần giữa: tìm kiếm + menu điều hướng */}
        <div className="d-flex align-items-center">

          {/* Ô tìm kiếm */}
          <div className="search-wrapper" ref={wrapperRef}>
          <div className={`search ${showInput ? "show" : ""}`}>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="input_search"
            />
            <button className="btn_search" onClick={toggleSearch}>
              <img
                src="./assets/icons/search-icon.png"
                alt="Search"
                className="icon_search"
              />
            </button>
          </div>
        </div>

          {/* Menu điều hướng: Tất cả, Tin nhắn, Thông báo */}
          <div className="function_button ms-3">
            <ul className="nav">
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
          </div>
        </div>

        {/* Khu vực admin: icon + tên admin */}
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
};

export default Header;
