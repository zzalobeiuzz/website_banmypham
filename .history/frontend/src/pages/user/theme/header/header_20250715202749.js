import {
  faAngleRight,
  faBars,
  faPhoneVolume,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginPopup from "../../../../components/LoginPopup";
import { API_BASE, UPLOAD_BASE } from "../../../../constants";
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
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const location = useLocation();
  const { request } = useHttp();

  // ✅ Load category khi mount
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

  // ✅ Xử lý scroll header
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    if (location.state?.showLogin) {
      setShowLogin(true);
      window.history.replaceState({}, document.title);
    }

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

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.state, isFixed, lastScrollY]);

  // ✅ Toggle popup login
  const toggleLoginPopup = () => setShowLogin((prev) => !prev);

  // ✅ Toggle dropdown tìm kiếm
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  return (
    <>
      <div className={`header ${isFixed ? "fixed-elements" : ""}`}>
        {/* ---------- Header top ---------- */}
        <div className="header-top">
          <div className="container">
            <FontAwesomeIcon icon={faPhoneVolume} />
            <span className="ms-2">0364670752</span>
          </div>
        </div>

        {/* ---------- Header main ---------- */}
        <div className="header-main">
          <div className="container">
            <Link to="/">
              <img
                className="logo-img"
                style={{ display: isFixed ? "none" : "block" }}
                src={`${UPLOAD_BASE}/assets/images/logo.png`}
                alt="logo"
              />
              <img
                className="logo-img-fixed"
                style={{ display: isFixed ? "block" : "none" }}
                src={`${UPLOAD_BASE}/assets/images/logo-fixed.png`}
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
                    {categories.map((category) => (
                      <div
                        key={category.CategoryID}
                        className="menu_subcategory"
                        onMouseEnter={() => setActiveCategoryId(category.CategoryID)}
                        onMouseLeave={() => setActiveCategoryId(null)}
                      >
                        <a href="/" className="category-name">
                          {category.CategoryName}
                          <FontAwesomeIcon icon={faAngleRight} className="angle-icon" />
                        </a>
                        {category.SubCategories && category.SubCategories.length > 0 && (
                          <div
                            className={`menu-content ${activeCategoryId === category.CategoryID ? "active" : ""}`}
                          >
                            <div className="menu-group-top">
                              <a href="/">Nổi bật</a>
                              <a href="/">Bán chạy</a>
                              <a href="/">Hàng mới</a>
                            </div>
                            <div className="menu-group-bottom">
                              {category.SubCategories.map((sub) => (
                                <div className="menu-col-item" key={sub.SubCategoryID}>
                                  <a href="/" className="item-parent">
                                    {sub.SubCategoryName}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="search-bar">
                <form className="search" tabIndex={0} onBlur={() => setDropdownOpen(false)}>
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

                  <input className="input-search" placeholder="Tìm kiếm sản phẩm bạn mong muốn...." />
                  <button className="btn search-icon" type="submit">
                    <img src={`${UPLOAD_BASE}/assets/icons/search-icon.png`} alt="icon-search" />
                  </button>
                </form>

                <Link className="shopping-cart">
                  <img
                    src={`${UPLOAD_BASE}/assets/icons/shopping-cart-icon.png`}
                    alt="icon-shopping-cart"
                  />
                  <span>Giỏ hàng</span>
                </Link>

                {showCustomService && (
                  <Link className="custom-service">
                    <img
                      src={`${UPLOAD_BASE}/assets/icons/hotline-icon.png`}
                      alt="icon-hotline"
                    />
                    <span>Hỗ trợ khách hàng</span>
                  </Link>
                )}

                {user ? (
                  <div className="login-info d-flex align-items-center gap-3">
                    <div className="login-button">
                      <img
                        src={`${UPLOAD_BASE}/assets/icons/icons8-web-account.png`}
                        alt="icon-user"
                      />
                      <span>{showCustomService ? `Xin chào, ${user.name}` : user.name}</span>
                    </div>
                    <button
                      className="btn btn-sm btn-danger p-10"
                      onClick={() => {
                        localStorage.clear();
                        setUser(null);
                        window.location.reload();
                      }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <button onClick={toggleLoginPopup} className="login-button">
                    <img
                      src={`${UPLOAD_BASE}/assets/icons/icons8-web-account.png`}
                      alt="icon-user"
                    />
                    <span>Đăng nhập</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Header bottom ---------- */}
        <div className="header-bottom">
          <div className="container header-bottom-menu header-menu">
            <div className={`menu_item menu_site ${isFixed ? "fixed-elements" : ""}`}>
              <a href="/" className="item">
                <FontAwesomeIcon icon={faBars} className="fas" />
                Danh mục sản phẩm
              </a>
              <div className="menu_content">
                {categories.map((category) => (
                  <div
                    key={category.CategoryID}
                    className="menu_subcategory"
                    onMouseEnter={() => setActiveCategoryId(category.CategoryID)}
                    onMouseLeave={() => setActiveCategoryId(null)}
                  >
                    <a href="/" className="category-name">
                      {category.CategoryName}
                      <FontAwesomeIcon icon={faAngleRight} className="angle-icon" />
                    </a>
                    {category.SubCategories && category.SubCategories.length > 0 && (
                      <div
                        className={`menu-content ${activeCategoryId === category.CategoryID ? "active" : ""}`}
                      >
                        <div className="menu-group-top">
                          <a href="/">Nổi bật</a>
                          <a href="/">Bán chạy</a>
                          <a href="/">Hàng mới</a>
                        </div>
                        <div className="menu-group-bottom">
                          {category.SubCategories.map((sub) => (
                            <div className="menu-col-item" key={sub.SubCategoryID}>
                              <a href="/" className="item-parent">
                                {sub.SubCategoryName}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
