import React, { useState, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { faPhoneVolume } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./header.scss";

const Header = () => {
  const [isFixed, setIsFixed] = useState(false);

  const handleScroll = () => {
    if (window.scrollY > 100) { // Điều chỉnh giá trị 100px tùy thuộc vào kích thước header của bạn
      setIsFixed(true);
    } else {
      setIsFixed(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`header ${isFixed ? 'header-fixed' : ''}`}>
      <div className="header-top">
        <div className="container">
          <FontAwesomeIcon icon={faPhoneVolume} />
          <span className="phone">0364670752</span>
        </div>
      </div>
      <div className={`header-main ${isFixed ? 'hidden-header' : ''}`}>
        <div className="container-header-main">
          <Link to="/">
            <img
              className="logo-img"
              src="/assets/images/logo.png"
              alt="logo"
            />
          </Link>
          <div className="search-bar">
            <form className="search">
              <button
                className="dropdown"
                style={{ padding: "10px 20px", cursor: "pointer" }}
              >
                Tất cả
              </button>
              <input
                className="input-search"
                placeholder="Tìm kiếm sản phẩm bạn mong muốn"
              />
              <button className="search-icon">
                <img
                  src="/assets/icons/search-icon.png"
                  alt="icon-search"
                  style={{ width: "100%", height: "auto" }}
                />
              </button>
            </form>
            <Link className="no-underline">
              <img
                src="https://cocolux.com/images/cart-icon.svg"
                alt="icon-shopping-cart"
              />
              <span>Giỏ hàng</span>
            </Link>
            <Link className="no-underline">
              <img
                src="/assets/icons/hotline-icon.png"
                alt="icon-hotline"
              />
              <span>Hỗ trợ khách hàng</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="header-bottom">
        {/* Nội dung phần dưới của header */}
      </div>
    </div>
  );
};

export default memo(Header);
