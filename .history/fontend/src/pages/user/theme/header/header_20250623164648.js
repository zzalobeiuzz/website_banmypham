import { faAngleRight, faBars, faPhoneVolume } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginPopup from "../../../../components/login";
import "./header.scss";

const Header = () => {
  const [user, setUser] = useState(null); // Lưu thông tin người dùng sau khi login
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

  //useEffect Khôi phục user từ localStorage khi load trang chủ
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // useEffect để xử lý sự kiện scroll trang
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;
      console.log(isScrollingDown, currentScrollY)

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
                <div className="show-when-fixed">
                  <a href="/" className="item">
                    <FontAwesomeIcon icon={faBars} className="fas" />
                    Danh mục sản phẩm
                  </a>
                  <div className="menu_content ">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div className="menu_subcategory" key={i}>
                        <a href="/">sd
                          <FontAwesomeIcon icon={faAngleRight} className="angle-icon" /></a>
                        <div class="menu-content" style={{ display: 'none' }}>
                          <div class="position-relative h-100 w-100">
                            <div class="menu-group-top">
                              <a href="https://cocolux.com/danh-muc/trang-diem-makeup-i.83?sort=1">Nổi
                                bật</a>
                              <a href="https://cocolux.com/danh-muc/trang-diem-makeup-i.83?sort=2">Bán
                                chạy</a>
                              <a href="https://cocolux.com/danh-muc/trang-diem-makeup-i.83?sort=3">Hàng
                                mới</a>
                            </div>
                            <div class="menu-group-bottom">
                              <div class="menu-col-item">
                                <a href="https://cocolux.com/danh-muc/trang-diem-mat-i.84" class="item-parent">Trang Điểm Mặt</a>
                                <a href="https://cocolux.com/danh-muc/kem-lot-i.85" class="item-child">Kem Lót</a>
                                <a href="https://cocolux.com/danh-muc/kem-nen-bb-cream-i.86" class="item-child">Kem Nền - BB Cream</a>
                                <a href="https://cocolux.com/danh-muc/che-khuyet-diem-i.88" class="item-child">Che Khuyết Điểm</a>
                                <a href="https://cocolux.com/danh-muc/phan-phu-i.89" class="item-child">Phấn Phủ</a>
                                <a href="https://cocolux.com/danh-muc/xit-khoa-nen-i.191" class="item-child">Xịt Khoá Nền</a>
                                <a href="https://cocolux.com/danh-muc/phan-ma-i.90" class="item-child">Phấn Má</a>
                                <a href="https://cocolux.com/danh-muc/phan-nuoc-cushion-i.91" class="item-child">Phấn Nước - Cushion</a>
                                <a href="https://cocolux.com/danh-muc/tao-khoi-hightlight-i.92" class="item-child">Tạo Khối - Hightlight</a>
                              </div>
                              <div class="menu-col-item">
                                <a href="https://cocolux.com/danh-muc/trang-diem-mat-i.93" class="item-parent">Trang Điểm Mắt</a>
                                <a href="https://cocolux.com/danh-muc/phan-mat-nhu-mat-i.94" class="item-child">Phấn Mắt/Nhũ Mắt</a>
                                <a href="https://cocolux.com/danh-muc/ke-mat-i.95" class="item-child">Kẻ Mắt</a>
                                <a href="https://cocolux.com/danh-muc/ke-chan-may-i.96" class="item-child">Kẻ Chân Mày</a>
                              </div>
                            </div>
                            <div class="menu-poster 2345234">
                            </div>
                          </div>
                        </div>

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
                  {dropdownOpen && (
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
                  <button className="btn search-icon" type="submit">
                    <img
                      src="/assets/icons/search-icon.png"
                      alt="icon-search"
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
                {user ? (
                  // Nếu đã đăng nhập
                  <div className="login-info d-flex align-items-center gap-2">
                    {/* Hiển thị lời chào */}
                    <span>Xin chào, {user.name}</span>

                    {/* Nút đăng xuất */}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        // Xóa thông tin đăng nhập khỏi localStorage
                        localStorage.removeItem("user");
                        // Reset state user
                        setUser(null);
                        // Reload lại trang (hoặc có thể chuyển hướng về "/")
                        window.location.reload();
                      }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  // Nếu chưa đăng nhập
                  <button onClick={toggleLoginPopup} className="login-button">
                    <img src="/assets/icons/icons8-web-account.png" alt="icon-user" />
                    <span>Đăng nhập</span>
                  </button>
                )}


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
          onLoginSuccess={(userData) => setUser(userData)} // truyền callback
        />
      )}
    </>
  );
};

export default memo(Header);
