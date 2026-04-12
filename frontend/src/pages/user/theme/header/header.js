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

const CART_STORAGE_KEY = "cartItems";

const getCartCountFromStorage = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    const items = Array.isArray(parsed) ? parsed : [];

    return items.reduce((sum, item) => {
      const qty = Number(item?.quantity || 0);
      return sum + (Number.isFinite(qty) && qty > 0 ? qty : 0);
    }, 0);
  } catch (error) {
    return 0;
  }
};

const Header = () => {
  const [user, setUser] = useState(null);
  const [isFixed, setIsFixed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
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
    const hydrateUser = () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        setUser(null);
      }
    };

    hydrateUser();

    const handleUserUpdated = () => hydrateUser();
    const hydrateCart = () => setCartCount(getCartCountFromStorage());
    const handleCartUpdated = () => hydrateCart();
    const handleStorage = (event) => {
      if (!event?.key || event.key === CART_STORAGE_KEY) {
        hydrateCart();
      }
    };

    hydrateCart();
    window.addEventListener("user-updated", handleUserUpdated);
    window.addEventListener("cart-updated", handleCartUpdated);
    window.addEventListener("storage", handleStorage);

    if (location.state?.showLogin) {
      setShowLogin(true);
      window.history.replaceState({}, document.title);
    }

    const ENTER_FIXED_AT = 90;
    const EXIT_FIXED_AT = 10;

    const updateHeaderState = () => {
      const currentScrollY = Math.max(window.scrollY || 0, 0);
      const nextIsFixed =
        (isFixedRef.current && currentScrollY > EXIT_FIXED_AT) ||
        (!isFixedRef.current && currentScrollY > ENTER_FIXED_AT);

      if (nextIsFixed !== isFixedRef.current) {
        isFixedRef.current = nextIsFixed;
        setIsFixed(nextIsFixed);
      }

      tickingRef.current = false;
    };

    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(updateHeaderState);
    };

    updateHeaderState();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("user-updated", handleUserUpdated);
      window.removeEventListener("cart-updated", handleCartUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, [location.pathname, location.state]);

  // ✅ Toggle popup login
  const toggleLoginPopup = () => setShowLogin((prev) => !prev);

  // ✅ Toggle dropdown tìm kiếm
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const openCategoryMenu = () => setCategoryMenuOpen(true);
  const closeCategoryMenu = () => {
    if (isHomePage) {
      setCategoryMenuOpen(true);
      return;
    }
    setCategoryMenuOpen(false);
    setActiveCategoryId(null);
  };

  useEffect(() => {
    setCategoryMenuOpen(isHomePage);
  }, [isHomePage]);

  return (
    <>
      <div className={`header ${isFixed ? "fixed-elements" : ""} ${isProfilePage ? "profile-hover-menu" : ""}`}>
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
                    <img src={`${UPLOAD_BASE}/icons/search-icon.png`} alt="icon-search" />
                  </button>
                </form>

                <Link className="shopping-cart">
                  <div className="shopping-cart-icon-wrap">
                    <img
                      src={`${UPLOAD_BASE}/icons/shopping-cart-icon.png`}
                      alt="icon-shopping-cart"
                    />
                    {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
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
                    <Link to={`/${ROUTERS.USER.PROFILE}`} className="login-button">
                      <img
                        src={resolveAvatarSrc(user.avatar)}
                        alt="user-avatar"
                        className={user.avatar ? "user-avatar-thumb" : ""}
                      />
                      <span>{!isFixed ? `Xin chào, ${user.name}` : user.name}</span>
                    </Link>
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
