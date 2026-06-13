import {
  faAngleRight,
  faBars,
  faPhoneVolume,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  // Dropdown state cho phần chọn category nhỏ trên ô tìm kiếm
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Từ khóa người dùng đang gõ trong ô tìm kiếm (chỉ dùng để gợi ý và submit)
  const [searchKeyword, setSearchKeyword] = useState("");
  // Category tạm thời để lọc gợi ý trong header (không ảnh hưởng submit tìm kiếm chính)
  const [selectedSearchCategory, setSelectedSearchCategory] = useState("all");
  const [searchProducts, setSearchProducts] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const { cartCount } = useCart();

  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [isFixedMenuOpen, setIsFixedMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const isFixedRef = useRef(false);
  const tickingRef = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();
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

  // Tải danh sách sản phẩm để phục vụ gợi ý (suggestions) khi người dùng gõ
  // Lưu ý: đây là fetch nhẹ dùng cho gợi ý, không thay thế API phân trang chính.
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/user/products/loadAllProducts`,
        );

        const nextProducts = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];

        setSearchProducts(nextProducts);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
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

  // Tạo đường dẫn danh mục động: /all-products/:type với :type là tên category đã encode.
  const buildCategoryProductsPath = (categoryName) => {
    const normalizedCategory = String(categoryName || "").trim();
    if (!normalizedCategory) {
      return `/${ROUTERS.USER.ALL_PRODUCTS.replace(":type", "all")}`;
    }
    return `/${ROUTERS.USER.ALL_PRODUCTS.replace(":type", encodeURIComponent(normalizedCategory))}`;
  };

  // Điều hướng sang trang sản phẩm theo danh mục và đóng menu để UX mượt hơn.
  const navigateToCategoryProducts = (categoryName) => {
    const normalizedCategory = String(categoryName || "").trim();
    if (!normalizedCategory) return;

    const allProductsPath = buildCategoryProductsPath(normalizedCategory);

    setCategoryMenuOpen(false);
    setIsFixedMenuOpen(false);
    setActiveCategoryId(null);
    navigate(allProductsPath);
  };

  // Điều hướng sang trang sản phẩm theo cả category + subcategory.
  const navigateToSubCategoryProducts = (categoryName, subCategoryName) => {
    const normalizedCategory = String(categoryName || "").trim();
    const normalizedSubCategory = String(subCategoryName || "").trim();
    if (!normalizedCategory || !normalizedSubCategory) return;

    const basePath = buildCategoryProductsPath(normalizedCategory);
    const query = new URLSearchParams({
      category: normalizedCategory,
      subCategory: normalizedSubCategory,
    }).toString();

    setCategoryMenuOpen(false);
    setIsFixedMenuOpen(false);
    setActiveCategoryId(null);
    navigate(`${basePath}?${query}`);
  };

  // Khi submit tìm kiếm: luôn chuyển tới trang `all-products` kèm query `searchText`.
  // (Không gắn cứng category đã chọn trên nút dropdown vào luồng tìm chính.)
  const submitSearch = (e) => {
    e.preventDefault();

    const keyword = String(searchKeyword || "").trim();
    const targetPath = `/${ROUTERS.USER.ALL_PRODUCTS.replace(":type", "all")}`;

    const query = new URLSearchParams();
    if (keyword) {
      query.set("searchText", keyword);
    }

    // Đóng dropdown/gợi ý và chuyển trang
    setDropdownOpen(false);
    setSearchFocused(false);
    navigate(query.toString() ? `${targetPath}?${query.toString()}` : targetPath);
  };

  const getSelectedSearchCategoryLabel = () => {
    if (selectedSearchCategory === "all") return "Tất cả";

    const matchedCategory = categories.find(
      (category) => category.CategoryName === selectedSearchCategory,
    );

    return matchedCategory?.CategoryName || selectedSearchCategory;
  };

  const getResolvedProductImage = (image) => {
    const value = String(image || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
    return `${UPLOAD_BASE}/pictures/${value.replace(/^\/+/, "")}`;
  };

  // Tạo danh sách gợi ý (max 6) căn cứ vào từ khóa và category đã chọn trên nút
  const visibleSearchProducts = React.useMemo(() => {
    const keyword = String(searchKeyword || "").trim().toLowerCase();
    if (!keyword) return [];

    const selectedCategory = String(selectedSearchCategory || "all").trim();
    return searchProducts
      .filter((item) => {
        const productName = String(item?.ProductName || "").toLowerCase();
        const categoryName = String(item?.CategoryName || "").trim();
        const matchedKeyword = productName.includes(keyword);
        const matchedCategory =
          selectedCategory === "all" || categoryName === selectedCategory;

        return matchedKeyword && matchedCategory;
      })
      .slice(0, 6);
  }, [searchKeyword, searchProducts, selectedSearchCategory]);

  const shouldShowSearchSuggestions = searchFocused && visibleSearchProducts.length > 0;
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
                <div 
                  className={`show-when-fixed ${isFixedMenuOpen ? "open" : ""}`}
                  onMouseEnter={() => setIsFixedMenuOpen(true)}
                  onMouseLeave={() => setIsFixedMenuOpen(false)}
                >
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
                        <a
                          href={buildCategoryProductsPath(category.CategoryName)}
                          className="category-name"
                          onClick={(e) => {
                            // Dùng SPA navigation thay vì tải lại trang.
                            e.preventDefault();
                            navigateToCategoryProducts(category.CategoryName);
                          }}
                        >
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
                              <div className="menu-group-bottom">
                                {category.SubCategories.map((sub) => (
                                  <div
                                    className="menu-col-item"
                                    key={sub.SubCategoryID}
                                  >
                                    <a
                                      href={`${buildCategoryProductsPath(category.CategoryName)}?category=${encodeURIComponent(String(category.CategoryName || "").trim())}&subCategory=${encodeURIComponent(String(sub.SubCategoryName || "").trim())}`}
                                      className="item-parent"
                                      onClick={(e) => {
                                        // Subcategory đi vào trang riêng và lọc theo cả category + subcategory.
                                        e.preventDefault();
                                        navigateToSubCategoryProducts(
                                          category.CategoryName,
                                          sub.SubCategoryName,
                                        );
                                      }}
                                    >
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
                  onSubmit={submitSearch}
                >
                  <button
                    type="button"
                    className="btn btn-secondary dropdown-toggle dropdown"
                    aria-expanded={dropdownOpen}
                    onClick={toggleDropdown}
                  >
                    {getSelectedSearchCategoryLabel()}
                  </button>

                  {dropdownOpen && (
                    <ul className="dropdown-menu show">
                      {["all", ...categories.map((category) => category.CategoryName)].map(
                        (categoryName, i) => (
                          <li key={i}>
                            <a
                              className="dropdown-item"
                              href="/"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSelectedSearchCategory(categoryName || "all");
                                setDropdownOpen(false);
                              }}
                            >
                              {categoryName === "all" ? "Tất cả" : categoryName}
                            </a>
                          </li>
                        ),
                      )}
                    </ul>
                  )}

                  <input
                    className="input-search"
                    placeholder="Tìm kiếm sản phẩm bạn mong muốn...."
                    value={searchKeyword}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setSearchFocused(false);
                      }, 120);
                    }}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value);
                      setSearchFocused(true);
                    }}
                  />
                  <button className="btn search-icon" type="submit">
                    <img
                      src={`${UPLOAD_BASE}/icons/search-icon.png`}
                      alt="icon-search"
                    />
                  </button>

                  {shouldShowSearchSuggestions && (
                    <div className="search-suggestions">
                      <div className="search-suggestions__head">Sản phẩm gợi ý</div>
                      <ul className="search-suggestions__list">
                        {visibleSearchProducts.map((product) => (
                          <li key={product.ProductID}>
                            <a
                              href={`/product/${product.ProductID}`}
                              className="search-suggestions__item"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSearchFocused(false);
                                setDropdownOpen(false);
                                navigate(`/product/${product.ProductID}`);
                              }}
                            >
                              <span className="search-suggestions__thumb">
                                {getResolvedProductImage(product.Image) ? (
                                  <img
                                    src={getResolvedProductImage(product.Image)}
                                    alt={product.ProductName || "product"}
                                  />
                                ) : (
                                  <span className="search-suggestions__thumb-placeholder" />
                                )}
                              </span>
                              <span className="search-suggestions__meta">
                                <span className="search-suggestions__name">
                                  {product.ProductName}
                                </span>
                                <span className="search-suggestions__price">
                                  {(Number(product.sale_price || product.Price || 0)).toLocaleString("vi-VN")}đ
                                </span>
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                    <a
                      href={buildCategoryProductsPath(category.CategoryName)}
                      className="category-name"
                      onClick={(e) => {
                        // Dùng SPA navigation thay vì tải lại trang.
                        e.preventDefault();
                        navigateToCategoryProducts(category.CategoryName);
                      }}
                    >
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
                          <div className="menu-group-bottom">
                            {category.SubCategories.map((sub) => (
                              <div
                                className="menu-col-item"
                                key={sub.SubCategoryID}
                              >
                                <a
                                  href={`${buildCategoryProductsPath(category.CategoryName)}?category=${encodeURIComponent(String(category.CategoryName || "").trim())}&subCategory=${encodeURIComponent(String(sub.SubCategoryName || "").trim())}`}
                                  className="item-parent"
                                  onClick={(e) => {
                                    // Subcategory đi vào trang riêng và lọc theo cả category + subcategory.
                                    e.preventDefault();
                                    navigateToSubCategoryProducts(
                                      category.CategoryName,
                                      sub.SubCategoryName,
                                    );
                                  }}
                                >
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
              { label: "Khuyến mãi", url: `/${ROUTERS.USER.PROMOTIONS}` },
              { label: "Thương hiệu", url: "/all-products/featured-brands" },
              { label: "Giới thiệu", url: `/${ROUTERS.USER.ABOUT}` },
              { label: "Sản phẩm bán chạy", url: `/${ROUTERS.USER.BEAUTY_TRENDS}` },
              { label: "Hàng mới về", url: "/all-products/new-arrivals" },
              { label: "Hệ thống cửa hàng", url: `/${ROUTERS.USER.STORES}` },
            ].map((item, i) => (
              <div className="menu_item" key={i}>
                <Link to={item.url} className="item">{item.label}</Link>
              </div>
            ))}

            <div className="menu_search_order">
              <Link to={`/${ROUTERS.USER.ORDER_LOOKUP}`} className="item">
                Tra cứu đơn hàng
              </Link>
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
