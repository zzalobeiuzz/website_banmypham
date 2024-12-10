import { faBars, faPhoneVolume } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./header.scss";
const Header = () => {
  const [isFixed, setIsFixed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0); // Lưu trữ vị trí cuộn trước đó
  const [showCustomService, setShowCustomService] = useState(true);

  useEffect(() => {
    // Định nghĩa hàm handleScroll sẽ được gọi khi người dùng cuộn trang
    const handleScroll = () => {
      const currentScrollY = window.scrollY; // Lấy vị trí hiện tại của cuộn dọc (scroll Y)

      // Kiểm tra nếu vị trí cuộn hiện tại lớn hơn 20px
      if (currentScrollY > 20) {
        setIsFixed(true); // Thay đổi trạng thái isFixed thành true để áp dụng class cố định cho header
        setShowCustomService(false); // Ẩn phần custom-service khi cuộn xuống quá 20px
      } else {
        setIsFixed(false); // Thay đổi trạng thái isFixed thành false để loại bỏ class cố định
        setShowCustomService(true); // Hiển thị lại custom-service khi cuộn lên đầu trang
      }

      // Kiểm tra nếu người dùng cuộn lên (currentScrollY < lastScrollY)
      if (currentScrollY < lastScrollY) {
        setIsFixed(false); // Loại bỏ trạng thái cố định khi cuộn lên (gỡ bỏ class fixed-elements)
      }

      // Cập nhật lastScrollY để so sánh trong lần cuộn tiếp theo
      setLastScrollY(currentScrollY);
    };

    // Đăng ký sự kiện cuộn (scroll) trên cửa sổ
    window.addEventListener("scroll", handleScroll);

    // Dọn dẹp sự kiện khi component bị unmount hoặc khi effect thay đổi
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]); // useEffect chỉ chạy lại khi lastScrollY thay đổi

  return (
    <>
      <div className={`header ${isFixed ? "fixed-elements" : ""}`}>
        <div className="header-top">
          <div className="container">
            <FontAwesomeIcon icon={faPhoneVolume} />
            <span className="ms-2">0364670752</span>
          </div>
        </div>
        {/* Khi lăn màn hình, chỉ cố định logo-img, search-bar và shopping-cart */}
        <div className="header-main">
          <div className="container-header-main">
            <Link to="/">
              <img
                className="logo-img"
                style={{ display: isFixed ? "none" : "block" }}
                src={"/assets/images/logo.png"} // ẩn logo lớn sau khi lăn màn hình và ẩn logo nhỏ
                alt="logo"
              />
              <img
                className="logo-img-fixed"
                style={{ display: isFixed ? "block" : "none" }}
                src={"/assets/images/logo-fixed.png"} // ẩn logo nhỏ sau khi lăn màn hình và ẩn logo lớn
                alt="logo"
              />
            </Link>
            <div className="search-bar">
              <form className="search">
                <button
                  class="btn btn-secondary dropdown-toggle dropdown"
                  type="button"
                  id="dropdownMenuButton1"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Tất cả
                </button>
                <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                  <li>
                    <a class="dropdown-item" href="/">
                      Action
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="/">
                      Another action
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="/">
                      Something else here
                    </a>
                  </li>
                </ul>
                <input
                  className="input-search"
                  placeholder="Tìm kiếm sản phẩm bạn mong muốn"
                />
                <button className="search-icon">
                  <img
                    src="/assets/icons/search-icon.png"
                    alt="icon-search"
                    style={{ width: "80%", height: "auto" }}
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
              {/* Ẩn custom-service khi cuộn qua header */}
              {showCustomService && (
                <Link className="custom-service">
                  <img
                    src="/assets/icons/hotline-icon.png"
                    alt="icon-hotline"
                  />
                  <span>Hỗ trợ khách hàng</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Nội dung của header-bottom */}
        <div className="header-bottom " style={{ marginTop: isFixed ? "70px" : "0" }}>
          {/* 
            Kiểm tra trạng thái isFixed:
            - Nếu isFixed là true (khi header đã được cố định), set marginTop là 70px 
            - Nếu isFixed là false (khi header không cố định), set marginTop về 0px 
            Điều này giúp di chuyển phần tử .header-bottom xuống khi header bị cố định (fixed) trên trang khi cuộn.
          */}
          <div className="container header-bottom-menu header-menu">
            <div className="menu_item menu_site">
              <a href="/" className="item">
                <FontAwesomeIcon icon={faBars} className="fas" />
                Danh mục sản phẩm
              </a>
              <div className="menu_content">
                <div className="menu_item">
                  <a href="/">sd</a>
                </div>
                <div className="menu_item">
                  <a href="/">sd</a>
                </div>
                <div className="menu_item">
                  <a href="/">sd</a>
                </div>
                <div className="menu_item">
                  <a href="/">sd</a>
                </div>
                <div className="menu_item">
                  <a href="/">sd</a>
                </div>
                <div className="menu_item">
                  <a href="/">sd</a>
                </div>
                <div className="menu_item">
                  <a href="/">sd</a>
                </div>
                <div className="menu_item">
                  <a href="/">sd</a>
                </div>
                <div className="menu_item">
                  <a href="/">sd</a>
                </div>
                <div className="menu_item">
                  <a href="/">sd</a>
                </div>
                <div className="menu_item">
                  <a href="/">sd</a>
                </div>
              </div>
            </div>
            <div className="menu_item">
              <a href="/" className="item">
                Khuyến mãi
              </a>
            </div>
            <a href="/" className="item">
              Thương hiệu
            </a>
            <div className="menu_item">
              <a href="/" className="item">
                Giới thiệu
              </a>
            </div>
            <div className="menu_item">
              <a href="/" className="item">
                Xu hướng làm đẹp
              </a>
            </div>
            <div className="menu_item">
              <a href="/" className="item">
                Hàng mới về
              </a>
            </div>
            <div className="menu_item">
              <a href="/" className="item">
                Hệ thống cửa hàng
              </a>
            </div>
            <div className="menu-content"></div>
            <div className="menu_search_order">
              <a href="/" className="item">
                Tra cứu đơn hàng
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(Header);
