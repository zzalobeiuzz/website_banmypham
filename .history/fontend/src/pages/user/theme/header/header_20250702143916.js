import { faAngleRight, faBars, faPhoneVolume } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginPopup from "../../../../components/LoginPopup";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./header.scss";

const Header = () => {
  const [user, setUser] = useState(null);
  const [isFixed, setIsFixed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showCustomService, setShowCustomService] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const location = useLocation();
  const { request } = useHttp(); // <- GỌI HOOK Ở ĐÂY
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/user/products/loadCategory`);
        if (res.success) {
          setCategories(res.data);
        }
      } catch (error) {
        console.error("Lỗi khi load categories:", error);
      }
    };

    fetchCategories();
  }, [request]);

  useEffect(() => {
    // Hàm khôi phục user từ localStorage
    const restoreUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    // Hàm kiểm tra state showLogin từ location
    const checkShowLogin = () => {
      if (location.state?.showLogin) {
        setShowLogin(true);
        window.history.replaceState({}, document.title);
      }
    };

    // Hàm xử lý scroll
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;

      if (isScrollingDown && currentScrollY > 40 && !isFixed) {
        setIsFixed(true);
        setShowCustomService(false);
      }

      if (!isScrollingDown && currentScrollY <= 140 && isFixed) {
        setIsFixed(false);
        setShowCustomService(true);
      }

      setLastScrollY(currentScrollY);
    };

    // Gọi các hàm khởi tạo
    restoreUser();
    checkShowLogin();

    // Gán sự kiện scroll
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.state, isFixed, lastScrollY]);

  const toggleLoginPopup = () => setShowLogin((prev) => !prev);
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  return (
    <>
      <div className={`header ${isFixed ? "fixed-elements" : ""}`}>
        {/* Header top */}
        <div className="header-top">
          <div className="container">
            <FontAwesomeIcon icon={faPhoneVolume} />
            <span className="ms-2">0364670752</span>
          </div>
        </div>

        {/* Header main */}
        <div className="header-main">
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
                <div className="show-when-fixed">
                  <a href="/" className="item">
                    <FontAwesomeIcon icon={faBars} className="fas" />
                    Danh mục sản phẩm
                  </a>
                  <div className="menu_content">
                    {categories.map((category, i) => (
                      <div className="menu_subcategory" key={category.CategoryID || i}>
                        <a href="/">{category.CategoryName}
                          <FontAwesomeIcon icon={faAngleRight} className="angle-icon" />
                        </a>
                        <div className="menu-content" style={{ display: 'none' }}>
                          <div className="position-relative h-100 w-100">
                            <div className="menu-group-top">
                              <a href="/">Nổi bật</a>
                              <a href="/">Bán chạy</a>
                              <a href="/">Hàng mới</a>
                            </div>
                            <div className="menu-group-bottom">
                              <div className="menu-col-item">
                                <a href="/" className="item-parent">Trang Điểm Mặt</a>
                                <a href="/" className="item-child">Kem Lót</a>
                                <a href="/" className="item-child">Kem Nền</a>
                              </div>
                              <div className="menu-col-item">
                                <a href="/" className="item-parent">Trang Điểm Mắt</a>
                                <a href="/" className="item-child">Phấn Mắt</a>
                                <a href="/" className="item-child">Kẻ Mắt</a>
                              </div>
                            </div>
                          </div>
                        </div>
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

                <Link className="shopping-cart">
                  <img
                    src="/assets/icons/shopping-cart-icon.png"
                    alt="icon-shopping-cart"
                  />
                  <span>Giỏ hàng</span>
                </Link>

                {showCustomService && (
                  <Link className="custom-service">
                    <img src="/assets/icons/hotline-icon.png" alt="icon-hotline" />
                    <span>Hỗ trợ khách hàng</span>
                  </Link>
                )}

                {user ? (
                  <div className="login-info d-flex align-items-center gap-3">
                    <div className="login-button">
                      <img src="/assets/icons/icons8-web-account.png" alt="icon-user" />
                      <span>{showCustomService ? `Xin chào, ${user.name}` : user.name}</span>
                    </div>
                    <button
                      className="btn btn-sm btn-danger p-10"
                      onClick={() => {
                        localStorage.removeItem("user");
                        setUser(null);
                        window.location.reload();
                      }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <button onClick={toggleLoginPopup} className="login-button">
                    <img src="/assets/icons/icons8-web-account.png" alt="icon-user" />
                    <span>Đăng nhập</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Header bottom */}
        <div className="header-bottom">
          <div className="container header-bottom-menu header-menu">
            <div className={`menu_item menu_site ${isFixed ? "fixed-elements" : ""}`}>
              <a href="/" className="item">
                <FontAwesomeIcon icon={faBars} className="fas" />
                Danh mục sản phẩm
              </a>
              <div className="menu_content">
                {categories.map((category, i) => (
                  <></>
                  <div className="menu_subcategory" key={category.CategoryID || i}>
                    <a href="/">{category.CategoryName}</a>
                    <FontAwesomeIcon icon={faAngleRight} className="angle-icon" />
                  </div>
                  <div className="menu-content" style={{ display: 'block' }}>
                  <div className="position-relative h-100 w-100">
                    <div className="menu-group-top">
                      <a href="/">Nổi bật</a>
                      <a href="/">Bán chạy</a>
                      <a href="/">Hàng mới</a>
                    </div>
                    <div className="menu-group-bottom">
                      <div className="menu-col-item">
                        <a href="/" className="item-parent">Trang Điểm Mặt</a>
                        <a href="/" className="item-child">Kem Lót</a>
                        <a href="/" className="item-child">Kem Nền</a>
                      </div>
                      <div className="menu-col-item">
                        <a href="/" className="item-parent">Trang Điểm Mắt</a>
                        <a href="/" className="item-child">Phấn Mắt</a>
                        <a href="/" className="item-child">Kẻ Mắt</a>
                      </div>
                    </div>
                  </div>
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

            <div className="menu_search_order">
              <a href="/" className="item">
                Tra cứu đơn hàng
              </a>
            </div>
          </div>
        </div>
      </div>

      {showLogin && (
        <LoginPopup
          toggleLoginPopup={toggleLoginPopup}
          onLoginSuccess={(userData) => setUser(userData)}
        />
      )}
    </>
  );
};

export default memo(Header);
