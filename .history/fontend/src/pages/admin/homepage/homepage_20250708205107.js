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
  const [sectionOpen, setSectionOpen] = useState({
    management: true,
    event: true,
    revenue: true,
  });

  const toggleSection = (key) => {
    setSectionOpen((prev) => ({
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
        alert("Lỗi xác thực! Vui lòng đăng nhập lại.");
        localStorage.clear();
        navigate("/", { state: { showLogin: true } });
      }
    };

    checkAdmin();
  }, [request, navigate]);

  const MenuSection = ({ title, items, isOpen, onToggle }) => {
    const contentRef = useRef(null);
    const [height, setHeight] = useState("0px");

    useEffect(() => {
      if (isOpen && contentRef.current) {
        setHeight(`${contentRef.current.scrollHeight}px`);
      } else {
        setHeight("0px");
      }
    }, [isOpen, isCollapsed]); // thêm isCollapsed để fix layout khi thu nhỏ

    return (
      <li className={`menu-section ${isOpen ? "open" : ""}`}>
        <button className="content" onClick={onToggle}>
          <span className="label">{title}</span>
          <img src="./assets/icons/icons-arrow-down.png" alt="arrow toggle" />
        </button>

        <ul
          className="list-child"
          ref={contentRef}
          style={{
            maxHeight: height,
            overflow: "hidden",
            transition: "max-height 0.4s ease",
          }}
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
              isOpen={sectionOpen.management}
              onToggle={() => toggleSection("management")}
            />
            <MenuSection
              title="Quản lý sự kiện"
              items={eventItems}
              isOpen={sectionOpen.event}
              onToggle={() => toggleSection("event")}
            />
            <MenuSection
              title="Thống kê"
              items={revenueItems}
              isOpen={sectionOpen.revenue}
              onToggle={() => toggleSection("revenue")}
            />
          </ul>
        </div>
      </div>

      <div className="dynamic-content mt-2">
        <DynamicComponent />
      </div>
    </div>
  );
};

export default Homepage;
