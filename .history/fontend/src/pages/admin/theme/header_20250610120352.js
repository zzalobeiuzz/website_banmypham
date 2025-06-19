import React, { useState, useRef, useEffect } from "react";
import "./theme.scss";

const Header = () => {
  const [showInput, setShowInput] = useState(false);
  const wrapperRef = useRef(null);

  const toggleSearch = () => {
    setShowInput((prev) => !prev);
  };

  // Ẩn input khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
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
        {/* Logo */}
        <a href="/" className="logo me-3">
          <img src="/assets/images/logo.png" alt="Logo" style={{ width: 80 }} />
        </a>

        {/* Search và nav */}
        <div className="search-wrapper" ref={wrapperRef}>
          <div className={`search ${showInput ? "show" : ""}`}>
            <input
              type="text"
              className="input_search"
              placeholder="Tìm kiếm..."
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

        {/* Các phần khác... */}
      </div>
    </header>
  );
};

export default Header;
