import throttle from "lodash.throttle";
import React, { memo, useEffect, useRef, useState } from "react";
// ... import khác giữ nguyên

const Header = () => {
  const [isFixed, setIsFixed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCustomService, setShowCustomService] = useState(true);

  const location = useLocation();
  const headerRef = useRef(null);

  useEffect(() => {
    const handleScroll = throttle(() => {
      const scrollY = window.scrollY;
      const headerHeight = headerRef.current?.offsetHeight || 0;

      if (scrollY > headerHeight) {
        // Chỉ set khi isFixed chưa true để tránh re-render thừa
        setIsFixed((prev) => {
          if (!prev) return true;
          return prev;
        });
        setShowCustomService(false);
      } else {
        setIsFixed((prev) => {
          if (prev) return false;
          return prev;
        });
        setShowCustomService(true);
      }
    }, 100);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      handleScroll.cancel && handleScroll.cancel();
    };
  }, []);

  // Xử lý location.state mở popup
  useEffect(() => {
    if (location.state?.showLogin) {
      setShowLogin(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const toggleLoginPopup = () => setShowLogin((prev) => !prev);
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    alert("Đăng nhập thành công (ví dụ)");
    setShowLogin(false);
  };
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
          <div
            style={{ height: isFixed ? "100px" : "0px" }}
            className="header-placeholder"
          />
          <div className="container">
            <Link to="/" className={`logo-link ${isFixed ? "fixed-logo" : ""}`}>
              <img
                className="logo-img"
                src="/assets/images/logo.png"
                alt="logo"
                style={{ display: isFixed ? "none" : "block" }}
              />
              <img
                className="logo-img-fixed"
                src="/assets/images/logo-fixed.png"
                alt="logo"
                style={{ display: isFixed ? "block" : "none" }}
              />
            </Link>

            <div className="container-header-main">
              {isFixed && (
                <div className="menu_item menu_site show-when-fixed">
                  <a href="/" className="item">
                    <FontAwesomeIcon icon={faBars} className="fas" />
                    Danh mục sản phẩm
                  </a>
                  <div
                    className={`menu_content dropdown-menu ${
                      isFixed ? "margin-top-60" : ""
                    }`}
                    // Không thay style trực tiếp
                  >
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
          {/* Menu bottom giữ nguyên */}
          ...
        </div>
      </div>

      {showLogin && (
        <LoginPopup toggleLoginPopup={toggleLoginPopup} handleLoginSubmit={handleLoginSubmit} />
      )}
    </>
  );
};

export default memo(Header);
