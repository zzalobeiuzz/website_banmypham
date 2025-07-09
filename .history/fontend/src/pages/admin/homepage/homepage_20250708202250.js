import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import "./style.scss";

const Homepage = () => {
  const navigate = useNavigate();
  const { request } = useHttp();

  const [isCollapsed, setIsCollapsed] = useState(false);

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
    { icon: "./assets/icons/icons-conversion-rate.png", label: "Tỷ lệ chuyển đổi" },
  ];

  const [openSections, setOpenSections] = useState({
    managementItems: true,
    eventItems: true,
    revenueItems: true,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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
        await request("GET", `${API_BASE}/api/admin`, null, {
          Authorization: `Bearer ${token}`,
        });
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

            await request("GET", `${API_BASE}/api/admin`, null, {
              Authorization: `Bearer ${newAccessToken}`,
            });
          } catch (refreshError) {
            alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
            localStorage.clear();
            navigate("/", { state: { showLogin: true } });
          }
        } else {
          alert(error.response?.data?.message || "Bạn không có quyền truy cập trang này!");
          localStorage.clear();
          navigate("/", { state: { showLogin: true } });
        }
      }
    };

    checkAdmin();
  }, [request, navigate]);

  const MenuSection = ({ title, items, isOpen, onToggle }) => {
    const contentRef = useRef(null);
    const [maxHeight, setMaxHeight] = useState(isOpen ? "1000px" : "0px");
  
    const handleToggle = () => {
      if (isOpen) {
        setMaxHeight("0px");
      } else {
        setMaxHeight(`${contentRef.current.scrollHeight}px`);
      }
      onToggle(); // vẫn toggle isOpen ở cha để giữ trạng thái
    };
  
    useEffect(() => {
      if (isOpen) {
        setMaxHeight(`${contentRef.current.scrollHeight}px`);
      } else {
        setMaxHeight("0px");
      }
      // Chỉ chạy khi isOpen thay đổi, không bị ảnh hưởng bởi collapse
    }, [isOpen]);
  
    return (
      <li className={`menu-section ${isOpen ? "open" : ""}`}>
        <button className="content" onClick={handleToggle}>
          <span className="label">{title}</span>
          <img src="./assets/icons/icons-arrow-down.png" alt="arrow toggle" />
        </button>
        <ul
          className="list-child"
          ref={contentRef}
          style={{
            maxHeight,
            overflow: "hidden",
            transition: "max-height 0.4s ease",
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
};

export default Homepage;
