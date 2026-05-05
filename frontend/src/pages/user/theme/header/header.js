import {
  faAngleRight,
  faBars,
  faPhoneVolume,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginPopup from "../../../../components/login/LoginPopup";
import { API_BASE, UPLOAD_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import { ROUTERS } from "../../../../utils/router";
import "./header.scss";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const { user, logout, login } = useAuth(); // 👈 thêm login
  const [isFixed, setIsFixed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { cartCount } = useCart();

  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const isFixedRef = useRef(false);
  const tickingRef = useRef(false);

  const location = useLocation();
  const { request } = useHttp();

  const isProfilePage = location.pathname === `/${ROUTERS.USER.PROFILE}`;
  const normalizedPath = (location.pathname || "/").replace(/\/+$/, "") || "/";
  const isHomePage = normalizedPath === "/";

  const resolveAvatarSrc = (avatar) => {
    const value = String(avatar || "").trim();
    if (!value) return `${UPLOAD_BASE}/icons/icons8-web-account.png`;
    if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

    const normalized = value
      .replace(/^\/+/, "")
      .replace(/^uploads\/?assets\/?/i, "");
    return `${UPLOAD_BASE}/${normalized}`;
  };

  // ================= CATEGORY =================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/user/products/loadCategory`,
        );
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, [request]);

  // ================= USER + SCROLL =================
  useEffect(() => {
    const ENTER_FIXED_AT = 90;
    const EXIT_FIXED_AT = 10;

    const updateHeader = () => {
      const y = window.scrollY || 0;

      const next =
        (isFixedRef.current && y > EXIT_FIXED_AT) ||
        (!isFixedRef.current && y > ENTER_FIXED_AT);

      if (next !== isFixedRef.current) {
        isFixedRef.current = next;
        setIsFixed(next);
      }

      tickingRef.current = false;
    };

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(updateHeader);
    };

    updateHeader();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [location.pathname, location.state]);

  // ================= LOGIN =================
  const toggleLoginPopup = () => setShowLogin((p) => !p);

  const toggleDropdown = () => setDropdownOpen((p) => !p);

  const openCategoryMenu = () => setCategoryMenuOpen(true);

  const closeCategoryMenu = () => {
    if (isHomePage) return setCategoryMenuOpen(true);
    setCategoryMenuOpen(false);
    setActiveCategoryId(null);
  };
  // Mở Popup Login
  useEffect(() => {
    const openLogin = () => setShowLogin(true);

    window.addEventListener("open-login", openLogin);

    return () => window.removeEventListener("open-login", openLogin);
  }, []);

  useEffect(() => {
    setCategoryMenuOpen(isHomePage);
  }, [isHomePage]);

  // ================= UI =================
  return (
    <>
      <div
        className={`header ${isFixed ? "fixed-elements" : ""} ${isProfilePage ? "profile-hover-menu" : ""}`}
      >
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
                src={`${UPLOAD_BASE}/images/logo.png`}
                alt="logo"
              />
              <img
                className="logo-img-fixed"
                style={{ display: isFixed ? "block" : "none" }}
                src={`${UPLOAD_BASE}/images/logo-fixed.png`}
                alt="logo"
              />
            </Link>

            <div className="container-header-main">
              {isFixed && (
                <div className={`show-when-fixed ${isHomePage ? "open" : ""}`}>
                  <a href="/" className="item">
                    <FontAwesomeIcon icon={faBars} className="fas" />
                    Danh mục sản phẩm
                  </a>
                  <div className="menu_content">
                    {categories.map((category) => (
                      <div
                        key={category.CategoryID}
                        className="menu_subcategory"
                        onMouseEnter={() =>
                          setActiveCategoryId(category.CategoryID)
                        }
                        onMouseLeave={() => setActiveCategoryId(null)}
                      >
                        <a href="/" className="category-name">
                          {category.CategoryName}
                          <FontAwesomeIcon
                            icon={faAngleRight}
                            className="angle-icon"
                          />
                        </a>
                        {category.SubCategories &&
                          category.SubCategories.length > 0 && (
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
                                  <div
                                    className="menu-col-item"
                                    key={sub.SubCategoryID}
                                  >
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
                        ),
                      )}
                    </ul>
                  )}

                  <input
                    className="input-search"
                    placeholder="Tìm kiếm sản phẩm bạn mong muốn...."
                  />
                  <button className="btn search-icon" type="submit">
                    <img
                      src={`${UPLOAD_BASE}/icons/search-icon.png`}
                      alt="icon-search"
                    />
                  </button>
                </form>

                <Link
                  to={`/${ROUTERS.USER.CARTDETAIL}`}
                  className="shopping-cart"
                >
                  <div className="shopping-cart-icon-wrap">
                    <img
                      src={`${UPLOAD_BASE}/icons/shopping-cart-icon.png`}
                      alt="icon-shopping-cart"
                    />
                    {cartCount > 0 && (
                      <span className="cart-count-badge">{cartCount}</span>
                    )}
                  </div>
                  <span>Giỏ hàng</span>
                </Link>

                {!isFixed && (
                  <Link className="custom-service">
                    <img
                      src={`${UPLOAD_BASE}/icons/hotline-icon.png`}
                      alt="icon-hotline"
                    />
                    <span>Hỗ trợ khách hàng</span>
                  </Link>
                )}

                {user ? (
                  <div className="login-info d-flex align-items-center gap-3">
                    <Link
                      to={`/${ROUTERS.USER.PROFILE}`}
                      className="login-button"
                    >
                      <img
                        src={resolveAvatarSrc(user.avatar)}
                        alt="user-avatar"
                        className={user.avatar ? "user-avatar-thumb" : ""}
                      />
                      <span>
                        {!isFixed ? `Xin chào, ${user.name}` : user.name}
                      </span>
                    </Link>
                    <button
                      className="btn btn-sm btn-danger p-10"
                      onClick={logout}
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <button onClick={toggleLoginPopup} className="login-button">
                    <img
                      src={`${UPLOAD_BASE}/icons/icons8-web-account.png`}
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
            <div
              className={`menu_item menu_site ${categoryMenuOpen || isHomePage ? "open" : ""} ${isFixed ? "fixed-elements" : ""}`}
              onMouseEnter={openCategoryMenu}
              onMouseLeave={closeCategoryMenu}
            >
              <button type="button" className="item">
                <FontAwesomeIcon icon={faBars} className="fas" />
                Danh mục sản phẩm
              </button>
              <div className="menu_content">
                {categories.map((category) => (
                  <div
                    key={category.CategoryID}
                    className="menu_subcategory"
                    onMouseEnter={() =>
                      setActiveCategoryId(category.CategoryID)
                    }
                    onMouseLeave={() => setActiveCategoryId(null)}
                  >
                    <a href="/" className="category-name">
                      {category.CategoryName}
                      <FontAwesomeIcon
                        icon={faAngleRight}
                        className="angle-icon"
                      />
                    </a>
                    {category.SubCategories &&
                      category.SubCategories.length > 0 && (
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
                              <div
                                className="menu-col-item"
                                key={sub.SubCategoryID}
                              >
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
          onLoginSuccess={(userData) => {
            login(userData);
            setShowLogin(false);
          }}
        />
      )}
    </>
  );
};

export default memo(Header);
