import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import DynamicComponent from "../components/DynamicComponent";
import "./style.scss";

const Homepage = () => {
  const navigate = useNavigate();
  const { request } = useHttp();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [openSections, setOpenSections] = useState({
    managementItems: true,
    eventItems: true,
    revenueItems: true,
  });

  const managementItems = [
    { icon: "./assets/icons/icons-product-management.png", label: "Sản phẩm" },
    { icon: "./assets/icons/icons-order.png", label: "Đơn hàng" },
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

  useEffect(() => {
    const checkAdmin = async () => {
      let token = localStorage.getItem("accessToken");
      if (!token) {
        alert("Bạn chưa đăng nhập! Vui lòng quay lại trang đăng nhập");
        localStorage.clear();
        navigate("/", { state: { showLogin: true } });
        return;
      }

      try {
        const res = await request("GET", `${API_BASE}/api/admin`, null, {
          Authorization: `Bearer ${token}`,
        });
        console.log("✅ Admin verified!", res);
      } catch (error) {
        if (error.status === 401 && error.message === "Token không hợp lệ") {
          try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) throw new Error("Không tìm thấy refresh token!");

            const newRes = await request("POST", `${API_BASE}/api/admin/refresh-token`, {
              refreshToken,
            });
            const newAccessToken = newRes.accessToken;
            localStorage.setItem("accessToken", newAccessToken);

            const retryRes = await request("GET", `${API_BASE}/api/admin`, null, {
              Authorization: `Bearer ${newAccessToken}`,
            });

            console.log("✅ Retry thành công!", retryRes);
          } catch (refreshError) {
            console.error("Lỗi refresh token:", refreshError);
            alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
            localStorage.clear();
            navigate("/", { state: { showLogin: true } });
          }
        } else {
          const msg = error.response?.data?.message || "Bạn không có quyền truy cập trang này!";
          alert(msg);
          localStorage.clear();
          navigate("/", { state: { showLogin: true } });
        }
      }
    };

    checkAdmin();
  }, [request, navigate]);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const MenuSection = ({ title, items, sectionKey }) => {
    const isOpen = openSections[sectionKey];
    const contentRef = useRef(null);
    const [height, setHeight] = useState("0px");

    useEffect(() => {
      if (isOpen && contentRef.current) {
        setHeight(`${contentRef.current.scrollHeight}px`);
      } else {
        setHeight("0px");
      }
    }, [isOpen]);

    return (
      <li className={`menu-section ${sectionKey} ${isOpen ? "open" : ""}`}>
        <button className="content" onClick={() => toggleSection(sectionKey)}>
          <span className="label">{title}</span>
          <img src="./assets/icons/icons-arrow-down.png" alt="arrow toggle" />
        </button>

        <ul
          className="list-child"
          ref={contentRef}
          style={{ maxHeight: height }}
        >
          {items.map((item, idx) => (
            <li className="child" key={idx}>
              <button>
                <img src={item.icon} alt={item.label} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </li>
    );
  };

  return (
    <div className="homepage d-flex">
      {/* Navbar bên trái */}
      <div className={`menu-panel p-0 ${isCollapsed ? "collapsed" : ""}`}>
        <div className="app-sidebar">
          <ul className="vertical-nav-menu metismenu">
            <li className="app-sidebar__heading">
              Menu
              <button
                className="collapse-toggle-btn"
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#3f6ad8",
                  marginLeft: "auto",
                  fontSize: "1rem",
                }}
              >
                {isCollapsed ? "➜" : "◀"}
              </button>
            </li>

            <li className="btn_top">
              <button>
                <a href="/">
                  <img src="./assets/icons/icons8-home-50.png" alt="Trang chủ" />
                  {!isCollapsed && <span>Trang chủ</span>}
                </a>
              </button>
            </li>

            <MenuSection
              title="Quản lý"
              items={managementItems}
              sectionKey="managementItems"
            />
            <MenuSection
              title="Quản lý sự kiện"
              items={eventItems}
              sectionKey="eventItems"
            />
            <MenuSection
              title="Thống kê"
              items={revenueItems}
              sectionKey="revenueItems"
            />
          </ul>
        </div>
      </div>

      {/* Content bên phải */}
      <div className="dynamic-content mt-2">
        <DynamicComponent />
      </div>
    </div>
  );
};

export default Homepage;
