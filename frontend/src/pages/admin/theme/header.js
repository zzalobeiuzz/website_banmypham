/*
  Header quản trị
  - Quản lý thanh header trên trang admin, bao gồm menu chat, thông báo và avatar admin.
  - Chịu trách nhiệm mở/thu nhỏ/đóng các popup chat mini (`AdminMiniChatPopup`).
  - Duy trì trạng thái `miniChatRooms` chứa stack các popup và avatar thu nhỏ.
  - Bảo đảm tối đa 3 popup hiển thị cùng lúc (cắt mảng trước khi lưu vào state).
*/
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./theme.scss";
import { UPLOAD_BASE } from "../../../constants";
import AdminMiniChatPopup from "../components/DynamicHome/chat/components/AdminMiniChatPopup";

const navItems = [
  { icon: "icons8-menu-50.png", label: "Tất cả", className: "mega_menu" },
  { icon: "icons8-chat.gif", label: "Tin nhắn", className: "chat" },
  { icon: "icons8-bell.gif", label: "Thông báo", className: "notification" },
];

const resolveRoomTitle = (room) => {
  return String(room?.ParticipantName || room?.CreatedBy || room?.RoomKey || "").trim() || `Phòng #${room?.RoomID || ""}`;
};

const resolveRoomAvatar = (room) => {
  const value = String(room?.ParticipantAvatar || "").trim();
  if (!value) return `${UPLOAD_BASE}/icons/icons8-web-account.png`;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  const normalized = value.replace(/^\/+/, "").replace(/^uploads\/?assets\/?/i, "");
  return `${UPLOAD_BASE}/${normalized}`;
};

const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút`;
  if (diffHours < 24) return `${diffHours} giờ`;
  if (diffDays < 7) return `${diffDays} ngày`;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
};

const Header = ({ chatBadgeCount = 0, chatRooms = [], onOpenMiniChatRoom }) => {
  const [isActive, setIsActive] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const [chatQuery, setChatQuery] = useState("");
  const [chatTab, setChatTab] = useState("all");
  const [miniChatRooms, setMiniChatRooms] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminChatPage = location.pathname.startsWith("/admin/chat");

  const toggleSearch = () => {
    setIsActive((prev) => !prev);
  };

  const user = JSON.parse(localStorage.getItem("user"));

  const unreadRooms = useMemo(
    () => (Array.isArray(chatRooms) ? chatRooms.filter((room) => Number(room?.UnreadCount || 0) > 0) : []),
    [chatRooms],
  );

  const sortedRooms = useMemo(
    () =>
      Array.isArray(chatRooms)
        ? [...chatRooms].sort((a, b) => {
            const unreadDiff = Number(b?.UnreadCount || 0) - Number(a?.UnreadCount || 0);
            if (unreadDiff !== 0) return unreadDiff;
            const aTime = new Date(a?.LastMessageAt || a?.UpdatedAt || a?.CreatedAt || 0).getTime();
            const bTime = new Date(b?.LastMessageAt || b?.UpdatedAt || b?.CreatedAt || 0).getTime();
            return bTime - aTime;
          })
        : [],
    [chatRooms],
  );

  const filteredChatRooms = useMemo(() => {
    const query = String(chatQuery || "").trim().toLowerCase();

    return sortedRooms.filter((room) => {
      const unread = Number(room?.UnreadCount || 0);
      const title = resolveRoomTitle(room).toLowerCase();
      const preview = String(room?.LastMessageText || "").toLowerCase();

      if (chatTab === "unread" && unread <= 0) return false;
      if (query && !title.includes(query) && !preview.includes(query)) return false;
      return true;
    });
  }, [chatQuery, chatTab, sortedRooms]);

  const popupMiniChatRooms = useMemo(
    () => miniChatRooms.filter((room) => !room?.__isMinimized),
    [miniChatRooms],
  );

  const avatarMiniChatRooms = useMemo(
    () => miniChatRooms.filter((room) => Boolean(room?.__isMinimized)),
    [miniChatRooms],
  );

  useEffect(() => {
    try {
      window.__adminMiniChatOpenCount = popupMiniChatRooms.length;
    } catch (e) {}

    return () => {
      try {
        if (window.__adminMiniChatOpenCount === popupMiniChatRooms.length) {
          delete window.__adminMiniChatOpenCount;
        }
      } catch (e) {}
    };
  }, [popupMiniChatRooms.length]);

  const insertRoomIntoOpenStack = useCallback((prevRooms, room) => {
    const nextRooms = prevRooms.filter((item) => String(item?.RoomID) !== String(room.RoomID));
    const firstMinimizedIndex = nextRooms.findIndex((item) => Boolean(item?.__isMinimized));
    const insertIndex = firstMinimizedIndex === -1 ? nextRooms.length : firstMinimizedIndex;

    // Thêm phòng vào vị trí trước các avatar đã thu nhỏ (nếu có), giữ thứ tự vừa mở
    nextRooms.splice(insertIndex, 0, {
      ...room,
      __isMinimized: false,
    });

    return nextRooms.length > 3 ? nextRooms.slice(nextRooms.length - 3) : nextRooms;
  }, []);

  const moveRoomToMinimizedStack = useCallback((prevRooms, roomId) => {
    const target = prevRooms.find((room) => String(room?.RoomID) === String(roomId));
    if (!target) return prevRooms;

    // Đưa phòng vào cuối mảng và đánh dấu là đã thu nhỏ
    const nextRooms = prevRooms.filter((room) => String(room?.RoomID) !== String(roomId));
    nextRooms.push({
      ...target,
      __isMinimized: true,
    });
    return nextRooms;
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenu("");
    window.addEventListener("click", handleClickOutside);

    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const openMiniChatRoom = useCallback((room) => {
    if (!room?.RoomID) return;

    setOpenMenu("");

    if (isAdminChatPage) {
      window.dispatchEvent(new CustomEvent("admin-open-room", { detail: room }));
      return;
    }

    setMiniChatRooms((prev) => {
      return insertRoomIntoOpenStack(prev, room);
    });
  }, [isAdminChatPage, insertRoomIntoOpenStack]);

  const bringMiniChatRoomToFront = useCallback((roomId) => {
    setMiniChatRooms((prev) => {
      const target = prev.find((room) => String(room?.RoomID) === String(roomId));
      if (!target) return prev;

      const nextRooms = prev.filter((room) => String(room?.RoomID) !== String(roomId));
      const firstMinimizedIndex = nextRooms.findIndex((room) => Boolean(room?.__isMinimized));
      const insertIndex = firstMinimizedIndex === -1 ? nextRooms.length : firstMinimizedIndex;

      nextRooms.splice(insertIndex, 0, {
        ...target,
        __isMinimized: false,
      });

      return nextRooms;
    });
  }, []);

  const sendMiniChatRoomToBack = useCallback((roomId) => {
    setMiniChatRooms((prev) => {
      return moveRoomToMinimizedStack(prev, roomId);
    });
  }, [moveRoomToMinimizedStack]);

  useEffect(() => {
    const handleAutoOpenRoom = (event) => {
      const room = event?.detail;
      try { console.debug('[Header] admin-auto-open-room received', room); } catch (e) {}
      if (!room?.RoomID) return;

      // Đóng menu chat dropdown khi có auto-open từ socket
      setOpenMenu("");
      setMiniChatRooms((prev) => {
        const cleaned = prev.filter((r) => String(r?.RoomID) !== String(room.RoomID));
        const firstMinimizedIndex = cleaned.findIndex((r) => Boolean(r?.__isMinimized));
        const insertIndex = firstMinimizedIndex === -1 ? cleaned.length : firstMinimizedIndex;

        // Chèn phòng auto-open vào stack (ưu tiên reload để lấy tin mới nhất)
        cleaned.splice(insertIndex, 0, {
          ...room,
          // auto-open should prefer fresh messages to avoid stale cached view
          __forceReload: true,
          __latestMessage: room?.__latestMessage || room?.__latestMessage,
          __isMinimized: false,
        });

        return cleaned.length > 3 ? cleaned.slice(cleaned.length - 3) : cleaned;
      });
    };

    window.addEventListener("admin-auto-open-room", handleAutoOpenRoom);
    return () => window.removeEventListener("admin-auto-open-room", handleAutoOpenRoom);
  }, []);

  const closeMiniChatRoom = (roomId) => {
    setMiniChatRooms((prev) => prev.filter((r) => String(r?.RoomID) !== String(roomId)));
  };

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
{className === "chat" ? (
                    <div className="chat-nav-group" onClick={(e) => e.stopPropagation()}>
                      <div
                        className="chat-nav-group__main"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setOpenMenu("");
                          navigate("/admin/chat");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenMenu("");
                            navigate("/admin/chat");
                          }
                        }}
                      >
                        <span className="chat-nav-group__icon">
                          <img src={`${UPLOAD_BASE}/icons/${icon}`} alt={label} loading="lazy" />
                          {Number(chatBadgeCount || 0) > 0 && (
                            <span className="nav-badge nav-badge--chat">{chatBadgeCount > 99 ? "99+" : chatBadgeCount}</span>
                          )}
                        </span>
                        <span className="chat-nav-group__label">{label}</span>
                        <img
                          src={`${UPLOAD_BASE}/icons/icons-arrow-down.png`}
                          alt="arrow"
                          className="arrow-down"
                          loading="lazy"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu((prev) => (prev === "chat" ? "" : "chat"));
                          }}
                        />
                      </div>

                      {openMenu === "chat" && (
                        <div className="chat-dropdown" onClick={(e) => e.stopPropagation()}>
                          <div className="chat-dropdown__header-row">
                            <div className="chat-dropdown__title-block">
                              <div className="chat-dropdown__heading">Đoạn chat</div>
                            </div>
                            <div className="chat-dropdown__header-actions">
                              <button type="button" className="chat-dropdown__icon-btn" aria-label="Tùy chọn">⋯</button>
                              <button
                                type="button"
                                className="chat-dropdown__icon-btn"
                                aria-label="Đóng"
                                onClick={() => setOpenMenu("")}
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div className="chat-dropdown__search">
                            <img src={`${UPLOAD_BASE}/icons/search-icon.png`} alt="search" loading="lazy" />
                            <input
                              type="text"
                              value={chatQuery}
                              onChange={(e) => setChatQuery(e.target.value)}
                              placeholder="Tìm kiếm tin nhắn"
                            />
                          </div>

                          <div className="chat-dropdown__tabs" role="tablist" aria-label="Bộ lọc phòng chat">
                            {[
                              { key: "all", label: "Tất cả" },
                              { key: "unread", label: "Chưa đọc" },
                            ].map((tab) => (
                              <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={chatTab === tab.key}
                                className={`chat-dropdown__tab${chatTab === tab.key ? " is-active" : ""}`}
                                onClick={() => setChatTab(tab.key)}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          <div className="chat-dropdown__list">
                          {filteredChatRooms.length > 0 ? (
                            filteredChatRooms.map((room) => {
                              const unread = Number(room?.UnreadCount || 0);
                              const lastMessage = String(room?.LastMessageText || "Chưa có tin nhắn").trim();
                              const lastMessageTime = formatRelativeTime(room?.LastMessageAt || room?.UpdatedAt || room?.CreatedAt);

                              return (
                                <button
                                  key={room.RoomID}
                                  type="button"
                                  className={`chat-dropdown__item${unread > 0 ? " is-unread" : ""}`}
                                  onClick={() => {
                                    if (typeof onOpenMiniChatRoom === "function") {
                                      onOpenMiniChatRoom(room);
                                    }
                                    openMiniChatRoom(room);
                                  }}
                                >
                                  <img className="chat-dropdown__avatar" src={resolveRoomAvatar(room)} alt={resolveRoomTitle(room)} />
                                  <div className="chat-dropdown__content">
                                    <div className="chat-dropdown__row">
                                      <span className="chat-dropdown__title">{resolveRoomTitle(room)}</span>
                                      <span className="chat-dropdown__time">{lastMessageTime}</span>
                                    </div>
                                    <div className="chat-dropdown__row chat-dropdown__row--preview">
                                      <div className="chat-dropdown__preview">{lastMessage || "Chưa có tin nhắn"}</div>
                                      {unread > 0 && <span className="chat-dropdown__count">{unread > 99 ? "99+" : unread}</span>}
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="chat-dropdown__empty">Không có hội thoại phù hợp</div>
                          )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      className={className}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                      if (isNotification) {
                        setOpenMenu((prev) => (prev === "notification" ? "" : "notification"));
                      }
                    }}
                  >
                    <img                       src={`${UPLOAD_BASE}/icons/${icon}`}                       alt={label}                       loading="lazy"                     />
                    {label}
                    <img                       src={`${UPLOAD_BASE}/icons/icons-arrow-down.png`}                       alt="arrow"                       className="arrow-down"                       loading="lazy"                     />
                  </button>
)}

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
                              if (typeof onOpenMiniChatRoom === "function") {
                                onOpenMiniChatRoom(room);
                              }
                              openMiniChatRoom(room);
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

        {popupMiniChatRooms.map((r, idx) => (
          <AdminMiniChatPopup
            key={r.RoomID}
            room={r}
            offsetIndex={idx}
            onClose={() => closeMiniChatRoom(r.RoomID)}
            onActivate={() => bringMiniChatRoomToFront(r.RoomID)}
            onMinimize={() => sendMiniChatRoomToBack(r.RoomID)}
          />
        ))}

        {avatarMiniChatRooms.map((r, idx) => (
          <AdminMiniChatPopup
            key={r.RoomID}
            room={r}
            offsetIndex={idx}
            onClose={() => closeMiniChatRoom(r.RoomID)}
            onActivate={() => bringMiniChatRoomToFront(r.RoomID)}
            onMinimize={() => sendMiniChatRoomToBack(r.RoomID)}
          />
        ))}
      </div>
    </header>
  );
};

export default Header;
