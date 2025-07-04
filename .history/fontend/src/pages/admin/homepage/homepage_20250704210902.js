import React, { useEffect, useRef, useState } from "react";
import { API_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import DynamicComponent from "../components/DynamicComponent";
import "./style.scss";
const Homepage = () => {
  const { request } = useHttp();

  const managementItems = [
    { icon: "./assets/icons/icons-product-management.png", label: "Sản phẩm" },
    { icon: "./assets/icons/icons-event.png", label: "Đơn hàng" },
    { icon: "./assets/icons/icons-product-category.png", label: "Danh mục" },
    { icon: "./assets/icons/icons-shipment.png", label: "Lô hàng" },
    { icon: "./assets/icons/icons-customer.png", label: "Khách hàng" },
    { icon: "./assets/icons/icons-account.png", label: "Tài khoản" },
  ];

  const eventItems = [
    { icon: "./assets/icons/icons-event.png", label: "Sự kiện giảm giá" },
    { icon: "./assets/icons/icons-hot-price.png", label: "Sản phẩm hot" },
    { icon: "./assets/icons/icons-sale.png", label: "Sản phẩm sale" },
  ];

  const revenueItems = [
    { icon: "./assets/icons/icons-analytics.png", label: "Tổng quan" },
    { icon: "./assets/icons/icons-revenue.png", label: "Doanh thu" },
    {
      icon: "./assets/icons/icons-conversion-rate.png",
      label: "Tỷ lệ chuyển đổi",
    },
  ];

  // ✅ Check admin khi load trang
  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "/";
        return;
      }

      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin`,
          // null, // không cần body
          "Check quyền admin",
          {
            Authorization: `Bearer ${token}`,
          }
        );

        console.log("✅ Admin verified!", res);
      } catch (error) {
        if (
          error.response &&
          error.response.status === 401 &&
          error.response.data.message === "Token không hợp lệ"
        ) {
          try {
            const refreshToken = localStorage.getItem("accessToken");
        
            const newRes = await request(
              "POST",
              `${API_BASE}/api/admin/refresh-token`,
              null,
              {
                Authorization: `Bearer ${newAccessToken}`,
              }
            );
        
            console.log("✅ Retry thành công!", newRes);
            return;
          } catch (refreshError) {
            alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
            window.location.href = "/";
          }
        } else {
          alert("Bạn không có quyền truy cập trang này!");
          window.location.href = "/";
        }
      }
    };

    checkAdmin();
  }, [request]);

  const MenuSection = ({ title, items, className = "" }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [height, setHeight] = useState("0px");
    const contentRef = useRef(null);

    useEffect(() => {
      if (isOpen && contentRef.current) {
        setHeight(`${contentRef.current.scrollHeight}px`);
      } else {
        setHeight("0px");
      }
    }, [isOpen]);

    return (
      <li className={`menu-section ${className} ${isOpen ? "open" : ""}`}>
        <button className="content" onClick={() => setIsOpen(!isOpen)}>
          <span className="label">{title}</span>
          <img src="./assets/icons/icons-arrow-down.png" alt="arrow toggle" />
        </button>

        <ul
          className="list-child"
          ref={contentRef}
          style={{
            maxHeight: height,
          }}
        >
          {items.map((item, idx) => (
            <li className="child" key={idx}>
              <button>
                <img src={item.icon} alt={item.label} />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </li>
    );
  };

  return (
    <div className="row flex-nowrap h-100 homepage">
      {/* Navbar bên trái */}
      <div className="menu-panel col-2 p-0">
        <div className="app-sidebar">
          <ul className="vertical-nav-menu metismenu">
            <li className="app-sidebar__heading">Menu</li>

            <li className="btn_top">
              <button>
                <a href="/">
                  <img
                    src="./assets/icons/icons8-home-50.png"
                    alt="Trang chủ"
                  />
                  <span>Trang chủ</span>
                </a>
              </button>
            </li>

            <MenuSection
              title="Quản lý"
              items={managementItems}
              className="managementItems"
            />
            <MenuSection
              title="Quản lý sự kiện"
              items={eventItems}
              className="eventItems"
            />
            <MenuSection
              title="Thống kê"
              items={revenueItems}
              className="revenueItems"
            />
          </ul>
        </div>
      </div>

      {/* Content bên phải */}
      <div className="dynamic-content col-10 mt-2">
        <DynamicComponent></DynamicComponent>
      </div>
    </div>
  );
};

export default Homepage;
