import React, { useEffect, useRef, useState } from "react";
import "./theme.scss";

const navItems = [
  { icon: "icons8-menu-50.png", label: "Tất cả", className: "mega_menu" },
  { icon: "icons8-chat.gif", label: "Tin nhắn", className: "chat" },
  { icon: "icons8-bell.gif", label: "Thông báo", className: "notification" },
];

const Header = () => {
  const [showInput, setShowInput] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const wrapperRef = useRef(null);

  const toggleSearch = () => {
    if (showInput) {
      setIsClosing(true);
      setTimeout(() => {
        setShowInput(false);
        setIsClosing(false);
      }, 230); // Phù hợp với CSS transition
    } else {
      setShowInput(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        if (showInput) {
          setIsClosing(true);
          setTimeout(() => {
            setShowInput(false);
            setIsClosing(false);
          }, 300);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInput]);

  return (
    <header className="bg-light border-bottom">
      <div className="container d-flex justify-content-between align-items-center">
        {/* Logo */}
        <a href="/" className="logo me-3">
          <img src="/assets/images/logo.png" alt="Logo" style={{ width: 80 }} />
        </a>

        {/* Search */}
        <div className="search-container">
          <div
            className={`search-wrapper ${showInput ? "show" : ""} ${isClosing ? "closing" : ""}`}
            ref={wrapperRef}
          >
            <div className="search">
              {(showInput || isClosing) && (
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className={`input_search ${showInput && !isClosing ? "visible" : ""}`}
                />
              )}
              <button className="btn_search" onClick={toggleSearch}>
                <img
                  src="./assets/icons/search-icon.png"
                  alt="Search"
                  className="icon_search"
                />
              </button>
            </div>
            <button
              className={`btn_close ${showInput && !isClosing ? "active" : ""}`}
            ></button>
          </div>
        </div>

        {/* Menu */}
        <div className="d-flex align-items-center">
          <div className="function_button ms-3">
            <ul className="nav">
              {navItems.map(({ icon, label, className }, i) => (
                <li key={i}>
                  <button className={className}>
                    <img src={`./assets/icons/${icon}`} alt={label} />
                    {label}
                    <img
                      src="./assets/icons/icons-arrow-down.png"
                      alt={label}
                      className="arrow-down"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Admin */}
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
