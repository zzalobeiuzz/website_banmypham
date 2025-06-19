import React, { useEffect, useRef, useState } from "react";
import "./theme.scss";

const Header = () => {
  const [showInput, setShowInput] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isHidden, setIsHidden] = useState(true);
  const wrapperRef = useRef(null);

  const toggleSearch = () => {
    if (showInput) {
      setIsClosing(true);
      setTimeout(() => {
        setShowInput(false);
        setIsClosing(false);
        setIsHidden(true); // Ẩn hoàn toàn sau animation
      }, 300);
    } else {
      setShowInput(true);
      setIsHidden(false); // Hiện lại ngay lập tức
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
            setIsHidden(true);
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
        <a href="/" className="logo me-3">
          <img src="/assets/images/logo.png" alt="Logo" style={{ width: 80 }} />
        </a>

        <div className="search-container">
          <div
            className={`search-wrapper ${showInput ? "show" : ""} ${isClosing ? "closing" : ""}`}
            ref={wrapperRef}
          >
            <div className="search">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className={`input_search ${showInput ? "visible" : ""} ${isClosing ? "closing" : ""} ${isHidden ? "hidden" : ""}`}
              />
              <button className="btn_search" onClick={toggleSearch}>
                <img
                  src="./assets/icons/search-icon.png"
                  alt="Search"
                  className="icon_search"
                />
              </button>
            </div>
            <button className={`btn_close ${showInput && !isClosing ? "active" : ""}`} />
          </div>
        </div>

        {/* ... các phần khác giữ nguyên ... */}
      </div>
    </header>
  );
};

export default Header;
