import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./theme.scss";
import { UPLOAD_BASE } from "../../../constants";

const navItems = [
  { icon: "icons8-menu-50.png", label: "Tất cả", className: "mega_menu" },
  { icon: "icons8-chat.gif", label: "Tin nhắn", className: "chat" },
  { icon: "icons8-bell.gif", label: "Thông báo", className: "notification" },
];

const Header = ({ chatBadgeCount = 0, chatRooms = [] }) => {
  const [isActive, setIsActive] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const navigate = useNavigate();

  const toggleSearch = () => {
    setIsActive((prev) => !prev);
  };

  const user = JSON.parse(localStorage.getItem("user"));

  const unreadRooms = useMemo(
    () => (Array.isArray(chatRooms) ? chatRooms.filter((room) => Number(room?.UnreadCount || 0) > 0) : []),
    [chatRooms],
  );

  useEffect(() => {
    const handleClickOutside = () => setOpenMenu("");
    window.addEventListener("click", handleClickOutside);

    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header>
      <div className="container header-shadow">
        {/* Logo */}
        <a href="/" className="logo">
          <img
            src={`${UPLOAD_BASE}/images/logo-removebg.png`}
            alt="Logo"
            loading="lazy"
          />
        </a>

        {/* Search */}
        <div className="search-container">
          <div className={`search-wrapper ${isActive ? "active" : ""}`}>
            <div className="search">
              <input
                type="text"
                placeholder="Tìm kiếm chức năng..."
                className="input_search"
              />
              <button
                className="btn_search"
                onClick={() => {
                  if (!isActive) toggleSearch();
                }}
              >
                <img
                  src={`${UPLOAD_BASE}/icons/search-icon.png`}
                  alt="Search"
                  className="icon_search"
                  loading="lazy"
                />
              </button>
            </div>
          </div>
          <button
            className={`close ${isActive ? "active" : ""}`}
            onClick={toggleSearch}
            aria-label="Close search"
          />
        </div>

        {/* Menu */}
        <div className="function_button">
          <ul className="nav">
            {navItems.map(({ icon, label, className }, i) => {
              const isNotification = className === "notification";

              return (
                <li key={i} className="nav-item-wrapper">
                  <button
                    className={className}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (className === "chat") {
                        navigate("/admin/chat");
                        return;
                      }

                      if (isNotification) {
                        setOpenMenu((prev) => (prev === "notification" ? "" : "notification"));
                      }
                    }}
                  >
                    <img
                      src={`${UPLOAD_BASE}/icons/${icon}`}
                      alt={label}
                      loading="lazy"
                    />
                    {className === "chat" && Number(chatBadgeCount || 0) > 0 && (
                      <span className="nav-badge">{chatBadgeCount > 99 ? "99+" : chatBadgeCount}</span>
                    )}
                    {className === "notification" && Number(chatBadgeCount || 0) > 0 && (
                      <span className="nav-badge nav-badge--notification">{chatBadgeCount > 99 ? "99+" : chatBadgeCount}</span>
                    )}
                    {label}
                    <img
                      src={`${UPLOAD_BASE}/icons/icons-arrow-down.png`}
                      alt="arrow"
                      className="arrow-down"
                      loading="lazy"
                    />
                  </button>

                  {isNotification && openMenu === "notification" && (
                    <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
                      <div className="notification-dropdown__header">Phòng có tin nhắn mới</div>
                      {unreadRooms.length > 0 ? (
                        unreadRooms.map((room) => (
                          <button
                            key={room.RoomID}
                            type="button"
                            className="notification-dropdown__item"
                            onClick={() => {
                              setOpenMenu("");
                              navigate("/admin/chat");
                            }}
                          >
                            <span className="notification-dropdown__title">{room.RoomTitle}</span>
                            <span className="notification-dropdown__count">{room.UnreadCount}</span>
                          </button>
                        ))
                      ) : (
                        <div className="notification-dropdown__empty">Không có tin nhắn mới</div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Admin */}
        <div className="admin">
          <button className="btn_admin">
            <img
              src={`${UPLOAD_BASE}/icons/icons-admin.png`}
              alt="Admin"
              className="icon_admin"
              loading="lazy"
            />
          </button>
          <span className="name_admin">{user?.name || "Admin"}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
