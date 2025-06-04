import { faAngleRight, faBars, faPhoneVolume } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import throttle from "lodash.throttle";
import React, { memo, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginPopup from "../../../../components/login";
import "./header.scss";

const Header = () => {
  const [isFixed, setIsFixed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCustomService, setShowCustomService] = useState(true);

  const location = useLocation();

  // Khai báo ref cho các phần DOM cần thiết
  const headerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
  
    const threshold = header.offsetHeight;
    const hysteresis = 5;
  
    const handleScroll = throttle(() => {
      const scrollPosition = window.scrollY;
  
      // Tính trạng thái mới dựa trên scroll
      let newIsFixed = isFixed;
      let newShowCustomService = showCustomService;
  
      if (scrollPosition > threshold + hysteresis) {
        newIsFixed = true;
        newShowCustomService = false;
      } else if (scrollPosition < threshold - hysteresis) {
        newIsFixed = false;
        newShowCustomService = true;
      }
      // Nếu scroll trong vùng ± hysteresis thì giữ nguyên
  
      // Chỉ set state nếu có thay đổi thật sự
      if (newIsFixed !== isFixed) setIsFixed(newIsFixed);
      if (newShowCustomService !== showCustomService) setShowCustomService(newShowCustomService);
  
      // Cập nhật margin dropdown nếu có ref
      if (dropdownRef.current) {
        dropdownRef.current.style.marginTop = newIsFixed ? "60px" : "0px";
      }
  
      console.log({ scrollPosition, isFixed: newIsFixed, showCustomService: newShowCustomService });
    }, 100);
  
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      handleScroll.cancel && handleScroll.cancel();
    };
  }, [isFixed, showCustomService]);
  
  
  
  // Mở popup login nếu location.state.showLogin = true
  useEffect(() => {
    if (location.state?.showLogin) {
      setShowLogin(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Toggle popup login
  const toggleLoginPopup = () => setShowLogin((prev) => !prev);

  // Submit form login (ví dụ)
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    alert("Đăng nhập thành công (ví dụ)");
    setShowLogin(false);
  };

  // Toggle dropdown menu "Tất cả"
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  return (
    <>
      <div className={`header ${isFixed ? "fixed-elements" : ""}`} ref={headerRef}>
        <div className="header-top">
          <div className="container">
            <FontAwesomeIcon icon={faPhoneVolume} />
            <span className="ms-2">0364670752</span>
          </div>
        </div>

        <div className="header-main">
          {/* Placeholder để tránh nhảy layout khi fixed */}
          <div style={{ height: isFixed ? "100px" : "0px" }} className="header-placeholder" />
          <div className="container">
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

            <div className="container-header-main">
              {isFixed && (
                <div className="menu_item menu_site show-when-fixed">
                  <a href="/" className="item">
                    <FontAwesomeIcon icon={faBars} className="fas" />
                    Danh mục sản phẩm
                  </a>
                  <div className="menu_content" ref={dropdownRef}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <div className="menu_subcategory" key={i}>
                        <a href="/">sd</a>
                        <FontAwesomeIcon icon={faAngleRight} className="angle-icon" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="search-bar">
                <form
                  className="search"
                  tabIndex={0}
                  onBlur={() => setDropdownOpen(false)}
                  onSubmit={(e) => e.preventDefault()}
                >
                  <button
                    type="button"
                    className="btn btn-secondary dropdown-toggle dropdown"
                    aria-expanded={dropdownOpen}
                    onClick={toggleDropdown}
                  >
                    Tất cả
                  </button>

                  {dropdownOpen && (
                    <ul className="dropdown-menu show">
                      {["Action", "Another action", "Something else here"].map((text, i) => (
                        <li key={i}>
                          <a
                            className="dropdown-item"
                            href="/"
                            onClick={(e) => e.preventDefault()}
                          >
                            {text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}

                  <input
                    className="input-search"
                    placeholder="Tìm kiếm sản phẩm bạn mong muốn...."
                  />
                  <button className="search-icon" type="submit">
                    <img
                      src="/assets/icons/search-icon.png"
                      alt="icon-search"
                      style={{ width: "80%" }}
                    />
                  </button>
                </form>

                <Link className="shopping-cart" to="/">
                  <img src="/assets/icons/shopping-cart-icon.png" alt="icon-shopping-cart" />
                  <span>Giỏ hàng</span>
                </Link>

                {showCustomService && (
                  <Link className="custom-service" to="/">
                    <img src="/assets/icons/hotline-icon.png" alt="icon-hotline" />
                    <span>Hỗ trợ khách hàng</span>
                  </Link>
                )}

                <button onClick={toggleLoginPopup} className="login-button" type="button">
                  <img src="/assets/icons/icons8-web-account.png" alt="icon-user" />
                  <span>Đăng nhập</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="header-bottom" style={{ marginTop: isFixed ? "70px" : 0 }}>
          <div className="container header-bottom-menu header-menu">
            <div className={`menu_item menu_site ${isFixed ? "fixed-elements" : ""}`}>
              <a href="/" className="item">
                <FontAwesomeIcon icon={faBars} className="fas" />
                Danh mục sản phẩm
              </a>
              <div className="menu_content">
                {Array.from({ length: 5 }, (_, i) => (
                  <div className="menu_subcategory" key={i}>
                    <a href="/">sd</a>
                    <FontAwesomeIcon icon={faAngleRight} className="angle-icon" />
                  </div>
                ))}
              </div>
            </div>

            {[
              "Khuyến mãi",
              "Thương hiệu",
              "Giới thiệu",
              "Xu hướng làm đẹp",
              "Hàng mới về",
              "Hệ thống cửa hàng",
            ].map((item, i) => (
              <div className="menu_item" key={i}>
                <a href="/" className="item">
                  {item}
                </a>
              </div>
            ))}

            <div className="menu-content"></div>

            <div className="menu_search_order">
              <a href="/" className="item">
                Tra cứu đơn hàng
              </a>
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
