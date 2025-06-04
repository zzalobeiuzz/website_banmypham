import { faAngleRight, faBars, faPhoneVolume } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginPopup from "../../../../components/login";
import "./header.scss";

const Header = () => {
  // State để theo dõi trạng thái cố định (fixed) khi scroll quá 20px
  const [isFixed, setIsFixed] = useState(false);

  // Lưu vị trí scroll Y lần trước để so sánh với vị trí hiện tại (dùng để xác định scroll lên hay xuống)
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hiển thị phần hỗ trợ khách hàng ở header top (ẩn khi scroll quá 20px)
  const [showCustomService, setShowCustomService] = useState(true);

  // Quản lý trạng thái hiển thị popup đăng nhập
  const [showLogin, setShowLogin] = useState(false);

  // Quản lý trạng thái dropdown menu "Tất cả" mở hay đóng
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Hook để lấy thông tin location từ react-router (dùng để xử lý khi chuyển trang có state truyền vào)
  const location = useLocation();
  
  // useEffect để xử lý sự kiện scroll trang
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;
      console.log(isScrollingDown,currentScrollY)

      // Nếu kéo xuống, vượt qua y = 30 và chưa fixed
      if (isScrollingDown && currentScrollY > 40 && !isFixed) {
        setIsFixed(true);
        setShowCustomService(false);
  
        // Cuộn xuống y = 150 nếu chưa tới
        // if (currentScrollY < 150) {
        //   window.scrollTo({ top: 150 });
        // }
      }
  
      // Nếu kéo lên (không cần kiểm tra hướng) và quay lại y <= 150
      if (!isScrollingDown && currentScrollY <= 140 && isFixed) {
        setIsFixed(false);
        setShowCustomService(true);
        // if (currentScrollY > 0) {
        //   window.scrollTo({ top:0 });
        // }
      }
  
      // Cập nhật vị trí cuối cùng
      setLastScrollY(currentScrollY);
    };
  
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFixed, lastScrollY]);
  
  

  // useEffect kiểm tra nếu location.state có trường showLogin = true thì mở popup đăng nhập
  useEffect(() => {
    if (location.state?.showLogin) {
      setShowLogin(true);

      // Xóa trạng thái showLogin trong history để tránh popup mở lại khi back trang
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Hàm toggle bật/tắt popup đăng nhập
  const toggleLoginPopup = () => setShowLogin((prev) => !prev);

  // Hàm xử lý submit form đăng nhập (ví dụ alert thành công và đóng popup)
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    alert("Đăng nhập thành công (ví dụ)");
    setShowLogin(false);
  };

  // Hàm này dùng để bật/tắt trạng thái dropdown menu "Tất cả"
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);  // và cập nhật nó thành giá trị ngược lại (true -> false, false -> true)

  // --- JSX render ---

  return (
    <>
      {/* Header chính */}
      <div className={`header ${isFixed ? "fixed-elements" : ""}`}>
        {/* Phần header-top: hotline */}
        <div className="header-top">
          <div className="container">
            <FontAwesomeIcon icon={faPhoneVolume} />
            <span className="ms-2">0364670752</span>
          </div>
        </div>

        {/* Phần header-main: logo + thanh tìm kiếm + giỏ hàng + đăng nhập */}
        <div className="header-main">
          <div className="container">
            {/* Logo (hiển thị logo khác khi fixed) */}
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

              {/* ✅ Thêm menu_site vào đây khi isFixed === true */}
              {isFixed && (
                <div className="menu_item menu_site show-when-fixed">
                  <a href="/" className="item">
                    <FontAwesomeIcon icon={faBars} className="fas" />
                    Danh mục sản phẩm
                  </a>
                  <div className="menu_content ">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div className="menu_subcategory" key={i}>
                        <a href="/">sd</a>
                        <FontAwesomeIcon icon={faAngleRight} className="angle-icon" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thanh tìm kiếm */}
              <div className="search-bar">
                <form
                  className="search"
                  tabIndex={0}
                  onBlur={() => setDropdownOpen(false)} // Tự động đóng dropdown khi mất focus (click ra ngoài)
                >
                  {/* Nút dropdown "Tất cả" */}
                  <button
                    type="button"
                    className="btn btn-secondary dropdown-toggle dropdown"
                    aria-expanded={dropdownOpen}
                    onClick={toggleDropdown}// Sự kiện click vào dropdown
                  >
                    Tất cả
                  </button>

                  {/* Hiển thị dropdown menu khi dropdownOpen = true */}
                  {!dropdownOpen && (
                    <ul className="dropdown-menu show">
                      {["Action", "Another action", "Something else here"].map(
                        (text, i) => (
                          <li key={i}>
                            <a
                              className="dropdown-item"
                              href="/"
                              onClick={(e) => e.preventDefault()}
                            >
                              {text}
                            </a>
                          </li>
                        )
                      )}
                    </ul>
                  )}

                  {/* Input tìm kiếm */}
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

                {/* Link giỏ hàng */}
                <Link className="shopping-cart">
                  <img
                    src="/assets/icons/shopping-cart-icon.png"
                    alt="icon-shopping-cart"
                  />
                  <span>Giỏ hàng</span>
                </Link>

                {/* Hiển thị link hỗ trợ khách hàng khi chưa scroll quá 20px */}
                {showCustomService && (
                  <Link className="custom-service">
                    <img src="/assets/icons/hotline-icon.png" alt="icon-hotline" />
                    <span>Hỗ trợ khách hàng</span>
                  </Link>
                )}

                {/* Nút đăng nhập */}
                <button onClick={toggleLoginPopup} className="login-button">
                  <img src="/assets/icons/icons8-web-account.png" alt="icon-user" />
                  <span>Đăng nhập</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Phần header-bottom: menu điều hướng chính */}
        <div className="header-bottom">
          <div className="container header-bottom-menu header-menu">
            {/* Menu danh mục sản phẩm với icon */}
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

            {/* Các menu link khác */}
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

            {/* Link tra cứu đơn hàng */}
            <div className="menu_search_order">
              <a href="/" className="item">
                Tra cứu đơn hàng
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Popup đăng nhập hiển thị khi showLogin = true */}
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
