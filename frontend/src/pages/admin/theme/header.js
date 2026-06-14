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
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import AdminMiniChatPopup from "../components/DynamicHome/chat/components/AdminMiniChatPopup";

const navItems = [
  { icon: "icons8-chat.gif", label: "Tin nhắn", className: "chat" },
  { icon: "icons8-bell.gif", label: "Thông báo", className: "notification" },
];

const adminSearchItems = [
  { icon: "icons-analytics.png", title: "Tổng quan", description: "Dashboard quản trị", path: "/admin", keywords: ["dashboard", "tong quan", "thong ke chung"] },
  { icon: "icons-product-management.png", title: "Sản phẩm", description: "Quản lý danh sách sản phẩm", path: "/admin/product", keywords: ["san pham", "product", "hang hoa"] },
  { icon: "icons-product-management.png", title: "Thêm sản phẩm", description: "Tạo sản phẩm mới", path: "/admin/product/add", keywords: ["them san pham", "tao san pham", "add product"] },
  { icon: "icons-product-category.png", title: "Danh mục", description: "Quản lý danh mục sản phẩm", path: "/admin/product/categories", keywords: ["danh muc", "category", "nhom san pham"] },
  { icon: "icons8-brand.png", title: "Thương hiệu", description: "Quản lý thương hiệu", path: "/admin/brand", keywords: ["thuong hieu", "brand", "hang"] },
  { icon: "icons-order.png", title: "Đơn hàng", description: "Theo dõi và xử lý đơn hàng", path: "/admin/order", keywords: ["don hang", "order", "hoa don"] },
  { icon: "icons-shipment.png", title: "Lô hàng", description: "Quản lý nhập hàng", path: "/admin/shipment", keywords: ["lo hang", "shipment", "nhap hang"] },
  { icon: "icons-customer.png", title: "Khách hàng", description: "Danh sách khách hàng", path: "/admin/customer", keywords: ["khach hang", "customer", "nguoi mua"] },
  { icon: "icons8-voucher-80.png", title: "Voucher", description: "Mã giảm giá", path: "/admin/voucher", keywords: ["voucher", "ma giam gia", "khuyen mai"] },
  { icon: "icons-event.png", title: "Sự kiện giảm giá", description: "Quản lý chương trình sale", path: "/admin/event/discount", keywords: ["su kien", "event", "giam gia", "chuong trinh"] },
  { icon: "icons-hot-price.png", title: "Sản phẩm hot", description: "Sản phẩm nổi bật", path: "/admin/event/hot", keywords: ["san pham hot", "hot", "noi bat"] },
  { icon: "icons-sale.png", title: "Sản phẩm sale", description: "Sản phẩm đang giảm giá", path: "/admin/event/sale", keywords: ["san pham sale", "sale", "giam gia"] },
  { icon: "icons-revenue.png", title: "Doanh thu", description: "Biểu đồ và chi tiết doanh thu", path: "/admin/stats", keywords: ["doanh thu", "revenue", "bao cao"] },
  { icon: "icons-account.png", title: "Tài khoản", description: "Quản lý tài khoản", path: "/admin/account", keywords: ["tai khoan", "account", "nguoi dung"] },
  { icon: "icons8-message-100.png", title: "Tư vấn khách hàng", description: "Chat với khách hàng", path: "/admin/chat", keywords: ["tu van", "tin nhan", "chat", "ho tro", "cham soc"] },
  { icon: "icons8-purchase-order-100.png", title: "Yêu cầu hỗ trợ", description: "Danh sách yêu cầu khách gửi", path: "/admin/support-requests", keywords: ["yeu cau ho tro", "support request", "khach gui", "cham soc"] },
];

const normalizeSearchText = (value) => (
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
);

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

const formatSupportDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const Header = ({ chatBadgeCount = 0, chatRooms = [], onOpenMiniChatRoom }) => {
  const [isActive, setIsActive] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [openMenu, setOpenMenu] = useState("");
  const [chatQuery, setChatQuery] = useState("");
  const [chatTab, setChatTab] = useState("all");
  const [miniChatRooms, setMiniChatRooms] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [selectedSupportRequest, setSelectedSupportRequest] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminChatPage = location.pathname.startsWith("/admin/chat");

  const toggleSearch = () => {
    setIsActive((prev) => !prev);
  };

  const user = JSON.parse(localStorage.getItem("user"));

  const notificationBadgeCount = Number(supportUnreadCount || 0);

  const filteredSearchItems = useMemo(() => {
    const query = normalizeSearchText(searchKeyword);
    if (!query) return [];

    return adminSearchItems
      .map((item) => {
        const haystack = normalizeSearchText([
          item.title,
          item.description,
          item.path,
          ...(item.keywords || []),
        ].join(" "));
        const title = normalizeSearchText(item.title);
        const score = title.includes(query) ? 2 : haystack.includes(query) ? 1 : 0;
        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "vi"))
      .slice(0, 8);
  }, [searchKeyword]);

  const openAdminSearchItem = useCallback((item) => {
    if (!item?.path) return;
    setSearchKeyword("");
    setIsActive(false);
    setOpenMenu("");
    navigate(item.path);
  }, [navigate]);

  const fetchSupportRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/support-requests/admin?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.success === false) return;

      setSupportRequests(Array.isArray(payload.data) ? payload.data : []);
      setSupportUnreadCount(Number(payload.unreadCount || 0));
    } catch (error) {
      console.error(error);
    }
  }, []);

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

  useEffect(() => {
    fetchSupportRequests();
    const timer = window.setInterval(fetchSupportRequests, 15000);
    return () => window.clearInterval(timer);
  }, [fetchSupportRequests]);

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
    const handleClickOutside = () => {
      setOpenMenu("");
      setSearchKeyword("");
      setIsActive(false);
    };
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

  const openSupportRequestDetail = async (requestItem) => {
    setSelectedSupportRequest(requestItem);
    setOpenMenu("");

    if (requestItem?.isRead) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/support-requests/admin/${requestItem.id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.success === false) return;

      setSupportUnreadCount(Number(payload.unreadCount || 0));
      setSupportRequests((prev) =>
        prev.map((item) => String(item.id) === String(requestItem.id) ? { ...item, isRead: true, readAt: payload.data?.readAt } : item),
      );
      setSelectedSupportRequest((prev) => prev && String(prev.id) === String(requestItem.id) ? { ...prev, isRead: true, readAt: payload.data?.readAt } : prev);
    } catch (error) {
      console.error(error);
    }
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
        <div className="search-container" onClick={(e) => e.stopPropagation()}>
          <div className={`search-wrapper ${isActive ? "active" : ""}`}>
            <div className="search">
              <input
                type="text"
                placeholder="Tìm kiếm chức năng..."
                className="input_search"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onFocus={() => setIsActive(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredSearchItems[0]) {
                    e.preventDefault();
                    openAdminSearchItem(filteredSearchItems[0]);
                  }
                  if (e.key === "Escape") {
                    setSearchKeyword("");
                    setIsActive(false);
                  }
                }}
              />
              <button
                type="button"
                className="btn_search"
                onClick={() => {
                  if (!isActive) {
                    toggleSearch();
                    return;
                  }
                  if (filteredSearchItems[0]) {
                    openAdminSearchItem(filteredSearchItems[0]);
                  }
                }}
              >
                <span className="btn_search__circle">
                  <img
                    src={`${UPLOAD_BASE}/icons/search-icon.png`}
                    alt="Search"
                    className="icon_search"
                    loading="lazy"
                  />
                </span>
              </button>
            </div>
          </div>
          <button
            type="button"
            className={`close ${isActive ? "active" : ""}`}
            onClick={() => {
              setSearchKeyword("");
              toggleSearch();
            }}
            aria-label="Close search"
          />
          {isActive && searchKeyword.trim() && (
            <div className="admin-search-dropdown">
              {filteredSearchItems.length > 0 ? (
                filteredSearchItems.map((item) => (
                  <button
                    type="button"
                    key={item.path}
                    className="admin-search-dropdown__item"
                    onClick={() => openAdminSearchItem(item)}
                  >
                    <span className="admin-search-dropdown__icon">
                      <img src={`${UPLOAD_BASE}/icons/${item.icon}`} alt="" loading="lazy" />
                    </span>
                    <span className="admin-search-dropdown__content">
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                  </button>
                ))
              ) : (
                <div className="admin-search-dropdown__empty">Không tìm thấy chức năng phù hợp</div>
              )}
            </div>
          )}
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
                    <span className="admin-nav-icon-wrap">
                      <img                       src={`${UPLOAD_BASE}/icons/${icon}`}                       alt={label}                       loading="lazy"                     />
                      {isNotification && notificationBadgeCount > 0 && (
                        <span className="nav-badge nav-badge--notification">
                          {notificationBadgeCount > 99 ? "99+" : notificationBadgeCount}
                        </span>
                      )}
                    </span>
                    {label}
                    <img                       src={`${UPLOAD_BASE}/icons/icons-arrow-down.png`}                       alt="arrow"                       className="arrow-down"                       loading="lazy"                     />
                  </button>
)}

                  {isNotification && openMenu === "notification" && (
                    <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
                      <div className="notification-dropdown__header">
                        <span>Yêu cầu hỗ trợ</span>
                        {notificationBadgeCount > 0 && <strong>{notificationBadgeCount > 99 ? "99+" : notificationBadgeCount}</strong>}
                      </div>
                      {supportRequests.length > 0 ? (
                        supportRequests.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`notification-dropdown__item notification-dropdown__item--support${item.isRead ? "" : " is-unread"}`}
                            onClick={() => openSupportRequestDetail(item)}
                          >
                            <span className="notification-dropdown__title">
                              {item.fullName || "Khách hàng chưa nhập tên"}
                            </span>
                            {!item.isRead && <span className="notification-dropdown__count">Mới</span>}
                          </button>
                        ))
                      ) : (
                        <div className="notification-dropdown__empty">Không có yêu cầu hỗ trợ</div>
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

        {selectedSupportRequest && (
          <div className="support-request-modal" onClick={() => setSelectedSupportRequest(null)}>
            <div className="support-request-modal__dialog" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="support-request-modal__close"
                aria-label="Đóng"
                onClick={() => setSelectedSupportRequest(null)}
              >
                ×
              </button>
              <div className="support-request-modal__eyebrow">Yêu cầu hỗ trợ</div>
              <h3>{selectedSupportRequest.fullName || "Khách hàng"}</h3>
              <div className="support-request-modal__meta">
                <div>
                  <span>Số điện thoại</span>
                  <strong>{selectedSupportRequest.phone || "Chưa cung cấp"}</strong>
                </div>
                <div>
                  <span>Loại vấn đề</span>
                  <strong>{selectedSupportRequest.issueType || "Chưa phân loại"}</strong>
                </div>
                <div>
                  <span>Mã đơn hàng</span>
                  <strong>{selectedSupportRequest.orderCode || "Không có"}</strong>
                </div>
                <div>
                  <span>Thời gian gửi</span>
                  <strong>{formatSupportDateTime(selectedSupportRequest.createdAt) || "Không rõ"}</strong>
                </div>
              </div>
              <div className="support-request-modal__message">
                <span>Nội dung khách hàng gửi</span>
                <p>{selectedSupportRequest.message || "Không có nội dung"}</p>
              </div>
            </div>
          </div>
        )}

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
