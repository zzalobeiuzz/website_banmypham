import { faBars, faPhoneVolume } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginPopup from "../../../../components/login";
import "./header.scss";

const Header = () => {
  const [isFixed, setIsFixed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showCustomService, setShowCustomService] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsFixed(currentScrollY > 20);
      setShowCustomService(currentScrollY <= 20);
      if (currentScrollY < lastScrollY) setIsFixed(false);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (location.state?.showLogin) setShowLogin(true);
  }, [location.state]);

  const toggleLoginPopup = () => setShowLogin((prev) => !prev);
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    alert("Đăng nhập thành công (ví dụ)");
    setShowLogin(false);
  };

  return (
    <>
      <div className={`header ${isFixed ? "fixed-elements" : ""}`}>
        <div className="header-top">
          <div className="container">
            <FontAwesomeIcon icon={faPhoneVolume} />
            <span className="ms-2">0364670752</span>
          </div>
        </div>

        <div className="header-main">
          <div className="container-header-main">
            <Link to="/">
              <img
                className="logo-img"
                style={{ display: isFixed ? "none" : "block" }}
                src="/assets/images/logo.png"
                alt="logo"
              />
              <img
                className="logo-img-fixed"
                style={{ display: isFixed ? "block" : "none" }}
                src="/assets/images/logo-fixed.png"
                alt="logo"
              />
            </Link>

            <div className="search-bar">
              <form className="search">
                <button
                  className="btn btn-secondary dropdown-toggle dropdown"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Tất cả
                </button>
                <ul className="dropdown-menu">
                  {["Action", "Another action", "Something else here"].map((text, i) => (
                    <li key={i}>
                      <a className="dropdown-item" href="/">{text}</a>
                    </li>
                  ))}
                </ul>
                <input className="input-search" placeholder="Tìm kiếm sản phẩm bạn mong muốn" />
                <button className="search-icon">
                  <img src="/assets/icons/search-icon.png" alt="icon-search" style={{ width: "80%" }} />
                </button>
              </form>

              <Link className="shopping-cart">
                <img src="/assets/icons/shopping-cart-icon.png" alt="icon-shopping-cart" />
                <span>Giỏ hàng</span>
              </Link>

              {showCustomService && (
                <Link className="custom-service">
                  <img src="/assets/icons/hotline-icon.png" alt="icon-hotline" />
                  <span>Hỗ trợ khách hàng</span>
                </Link>
              )}

              <button onClick={toggleLoginPopup} className="login-button">
                <img src="/assets/icons/icons8-web-account.png" alt="icon-user" />
                <span>Đăng nhập</span>
              </button>
            </div>
          </div>
        </div>

        <div className="header-bottom" style={{ marginTop: isFixed ? "70px" : 0 }}>
          <div className="container header-bottom-menu header-menu">
            <div className="menu_item menu_site">
              <a href="/" className="item">
                <FontAwesomeIcon icon={faBars} className="fas" />
                Danh mục sản phẩm
              </a>
              <div className="menu_content">
                {Array.from({ length: 11 }, (_, i) => (
                  <div className="menu_item" key={i}>
                    <a href="/">sd</a>
                  </div>
                ))}
              </div>
            </div>

            {["Khuyến mãi", "Thương hiệu", "Giới thiệu", "Xu hướng làm đẹp", "Hàng mới về", "Hệ thống cửa hàng"].map((item, i) => (
              <div className="menu_item" key={i}>
                <a href="/" className="item">{item}</a>
              </div>
            ))}

            <div className="menu-content"></div>
            <div className="menu_search_order">
              <a href="/" className="item">Tra cứu đơn hàng</a>
            </div>
          </div>
        </div>
      </div>

      {showLogin && (
        <LoginPopup toggleLoginPopup={toggleLoginPopup} handleLoginSubmit={handleLoginSubmit} />
      )}
    </>
  );
};

export default memo(Header);
