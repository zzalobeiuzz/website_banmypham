import React, { useState, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { faPhoneVolume } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./header.scss";

const Header = () => {
  const [isFixed, setIsFixed] = useState(false);
  const [showCustomService, setShowCustomService] = useState(true);

  const handleScroll = () => {
    if (window.scrollY > 100) {
      setIsFixed(true);
      setShowCustomService(false); // Ẩn custom-service khi cuộn qua 100px
    } else {
      setIsFixed(false);
      setShowCustomService(true); // Hiện custom-service khi cuộn lại lên đầu trang
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="header">
      <div className="banner">
        <img
          className="banner-img"
          src="https://cocolux.com/storage/upload_image/images/Bao_bi_moi/VQMM/topbanner.gif"
          alt="Logo"
        />
      </div>
      <div className="header-top">
        <div className="container">
          <FontAwesomeIcon icon={faPhoneVolume} />
          <span className="phone">0364670752</span>
        </div>
      </div>
      {/* Khi lăn màn hình, chỉ cố định logo-img, search-bar và shopping-cart */}
      <div className={"header-main"}>
        <div
          className={`container-header-main ${isFixed ? "fixed-elements" : ""}`}
        >
          <Link to="/">
            <img
              className="logo-img"
              src={
                isFixed
                  ? "/assets/images/logo-fixed.png"
                  : "/assets/images/logo.png"
              } // Logo khác nhau khi lăn màn hình
              alt="logo"
            />
          </Link>
          <div className="search-bar">
            <form className="search">
              <button className="dropdown">Tất cả</button>
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
            <Link className="shopping-cart">
              <img
                src="https://cocolux.com/images/cart-icon.svg"
                alt="icon-shopping-cart"
              />
              <span>Giỏ hàng</span>
            </Link>
            {/* Ẩn custom-service khi cuộn qua header */}
            {showCustomService && (
              <Link className="custom-service">
                <img src="/assets/icons/hotline-icon.png" alt="icon-hotline" />
                <span>Hỗ trợ khách hàng</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="header-bottom">{/* Nội dung phần dưới của header */}</div>
    </div>
  );
};

export default memo(Header);
