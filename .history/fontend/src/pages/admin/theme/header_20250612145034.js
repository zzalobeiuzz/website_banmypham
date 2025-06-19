import React, { useEffect, useRef, useState } from "react";
import "./theme.scss";

const Header = () => {
  const [showInput, setShowInput] = useState(false);
  const [inputHidden, setInputHidden] = useState(true);
  const wrapperRef = useRef(null);

  const toggleSearch = () => {
    if (!showInput) {
      setInputHidden(false);       // Hiện input trước
      setShowInput(true);          // Bắt đầu animation hiện
    } else {
      setShowInput(false);         // Bắt đầu animation ẩn
      setTimeout(() => setInputHidden(true), 300); // Ẩn hoàn toàn sau 300ms
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowInput(false);
        setTimeout(() => setInputHidden(true), 300);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="search-container">
      <div
        className={`search-wrapper ${showInput ? "show" : ""}`}
        ref={wrapperRef}
      >
        <div className="search">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className={`input_search ${showInput ? "visible" : ""} ${inputHidden ? "hidden" : ""}`}
          />
          <button className="btn_search" onClick={toggleSearch}>
            <img
              src="./assets/icons/search-icon.png"
              alt="Search"
              className="icon_search"
            />
          </button>
        </div>
        <button className={`btn_close ${showInput ? "active" : ""}`}></button>
      </div>
    </div>
  );
};

export default Header;
