import { faBars, faPhoneVolume } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginPopup from "../../../../components/login";
import "./header.scss";

const Header = () => {
  // Xác định trạng thái header có đang cố định (fixed) khi scroll xuống không
  const [isFixed, setIsFixed] = useState(false);

  // Lưu giá trị scroll trước đó để biết người dùng đang cuộn lên hay xuống
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hiển thị/ẩn phần "Hỗ trợ khách hàng" khi scroll
  const [showCustomService, setShowCustomService] = useState(true);

  // Hiển thị/ẩn popup đăng nhập
  const [showLogin, setShowLogin] = useState(false);

  // Lấy thông tin route hiện tại (bao gồm state được gửi kèm khi navigate)
  const location = useLocation();

  // Theo dõi sự kiện scroll để thay đổi trạng thái fixed và hiển thị dịch vụ
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Nếu cuộn xuống quá 20px thì cố định header
      setIsFixed(currentScrollY > 20);

      // Ẩn/hiện phần hỗ trợ khách hàng tùy theo vị trí scroll
      setShowCustomService(currentScrollY <= 20);

      // Nếu người dùng đang cuộn lên thì bỏ cố định header
      if (currentScrollY < lastScrollY) setIsFixed(false);

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Khi chuyển trang và có state { showLogin: true }, thì bật popup đăng nhập
  useEffect(() => {
    if (location.state?.showLogin) {
      setShowLogin(true);

      // Reset lại state để không hiện lại popup khi reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Toggle hiển thị popup đăng nhập
  const toggleLoginPopup = () => setShowLogin((prev) => !prev);

  // Xử lý submit form đăng nhập
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    alert("Đăng nhập thành công (ví dụ)");
    setShowLogin(false);
  };

  return (
    <>
      {/* HEADER CHÍNH */}
      <div className={`header ${isFixed ? "fixed-elements" : ""}`}>
        {/* Header top: hiển thị số điện thoại */}
        <div className="header-top">
          <div className="container">
            <FontAwesomeIcon icon={faPhoneVolume} />
            <span className="ms-2">0364670752</span>
          </div>
        </div>

        {/* Header main: logo, tìm kiếm, giỏ hàng, đăng nhập */}
        <div className="header-main">
          <div className="container-header-main">
            <Link to="/">
              {/* Logo bình thường */}
              <img
                className="logo-img"
                style={{ display: isFixed ? "none" : "block" }}
                src="/assets/images/logo.png"
                alt="logo"
              />
              {/* Logo cố định khi scroll */}
              <img
                className="logo-img-fixed"
                style={{ display: isFixed ? "block" : "none" }}
                src="/assets/images/logo-fixed.png"
                alt="logo"
              />
            </Link>

            <div className="search-bar">
              {/* Thanh tìm kiếm sản phẩm */}
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
                  {["Action", "Another action", "Something else here"].map(
                    (text, i) => (
                      <li key={i}>
                        <a className="dropdown-item" href="/">
                          {text}
                        </a>
                      </li>
                    )
                  )}
                </ul>
                <input
                  className="input-search"
                  placeholder="Tìm kiếm sản phẩm bạn mong muốn"
                />
                <button className="search-icon">
                  <img
                    src="/assets/icons/search-icon.png"
                    alt="icon-search"
                    style={{ width: "80%" }}
                  />
                </button>
              </form>

              {/* Giỏ hàng */}
              <Link className="shopping-cart">
                <img
                  src="/assets/icons/shopping-cart-icon.png"
                  alt="icon-shopping-cart"
                />
                <span>Giỏ hàng</span>
              </Link>

              {/* Hỗ trợ khách hàng (chỉ hiện khi chưa scroll xuống) */}
              {showCustomService && (
                <Link className="custom-service">
                  <img
                    src="/assets/icons/hotline-icon.png"
                    alt="icon-hotline"
                  />
                  <span>Hỗ trợ khách hàng</span>
                </Link>
              )}

              {/* Nút đăng nhập */}
              <button onClick={toggleLoginPopup} className="login-button">
                <img
                  src="/assets/icons/icons8-web-account.png"
                  alt="icon-user"
                />
                <span>Đăng nhập</span>
              </button>
            </div>
          </div>
        </div>

        {/* Menu dưới cùng */}
        <div
          className="header-bottom"
          style={{ marginTop: isFixed ? "70px" : 0 }}
        >
          <div className="container header-bottom-menu header-menu">
            {/* Menu bên trái: danh mục sản phẩm */}
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

            {/* Các mục menu chính */}
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

            {/* Tra cứu đơn hàng */}
            <div className="menu-content"></div>
            <div className="menu_search_order">
              <a href="/" className="item">
                Tra cứu đơn hàng
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Popup đăng nhập (hiện khi showLogin === true) */}
      {showLogin && (
        <LoginPopup
          toggleLoginPopup={toggleLoginPopup}
          handleLoginSubmit={handleLoginSubmit}
        />
      )}
    </>
  );
};

export default memo(Header);
