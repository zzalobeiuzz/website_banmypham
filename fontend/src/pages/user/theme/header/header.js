import { faPhoneVolume } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useState } from "react";
import { Link } from "react-router-dom";
import "./header.scss";

const Header = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

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
      <div className="header-main">
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
                onClick={toggleDropdown}
                style={{ padding: "10px 20px", cursor: "pointer" }}
              >
                Tất cả
              </button>
              <input
                className="input-search"
                placeholder="Tìm kiếm sản phẩm bạn mong muốn"
              ></input>
              <button className="search-icon">
                <img
                  src="/assets/icons/search-icon.png"
                  alt="icon-search"
                  style={{ width: "100%", height: "auto"}}
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
                alt="icon-shopping-cart"
              />
              <span>Hỗ trợ khách hàng</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="header-bottom">

      </div>
    </div>
  );
};

export default memo(Header);
