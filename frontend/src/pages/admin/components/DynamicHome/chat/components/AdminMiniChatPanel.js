import React, { useEffect, useMemo, useState } from "react";
import "../../theme/theme.scss";
import { UPLOAD_BASE } from "../../../../../../constants";

// Thanh menu chat của admin ở header: chọn phòng, mở popup và hiển thị badge chưa đọc.

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

const AdminMiniChatPanel = ({ chatBadgeCount = 0, chatRooms = [], preferredMiniChatRoom = null, onOpenMiniChatRoom = () => {}, onOpenDefaultMiniChat = () => {} }) => {
  const [isActive, setIsActive] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const [chatQuery, setChatQuery] = useState("");
  const [chatTab, setChatTab] = useState("all");

  const toggleSearch = () => setIsActive((p) => !p);

  const user = JSON.parse(localStorage.getItem("user"));

  const unreadRooms = useMemo(() => (Array.isArray(chatRooms) ? chatRooms.filter((room) => Number(room?.UnreadCount || 0) > 0) : []), [chatRooms]);

  const sortedRooms = useMemo(() =>
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

  useEffect(() => {
    const handleClickOutside = () => setOpenMenu("");
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="admin-mini-chat-panel">
      <div className="chat-dropdown__search">
        <img src={`${UPLOAD_BASE}/icons/search-icon.png`} alt="search" loading="lazy" />
        <input type="text" value={chatQuery} onChange={(e) => setChatQuery(e.target.value)} placeholder="Tìm kiếm tin nhắn" />
      </div>

      <div className="chat-dropdown__list">
        {filteredChatRooms.length > 0 ? (
          filteredChatRooms.map((room) => {
            const unread = Number(room?.UnreadCount || 0);
            const lastMessage = String(room?.LastMessageText || "Chưa có tin nhắn").trim();
            const lastMessageTime = formatRelativeTime(room?.LastMessageAt || room?.UpdatedAt || room?.CreatedAt);

            return (
              <button key={room.RoomID} type="button" className={`chat-dropdown__item${unread > 0 ? " is-unread" : ""}`} onClick={() => { if (typeof onOpenMiniChatRoom === "function") onOpenMiniChatRoom(room); }}>
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
  );
};

export default AdminMiniChatPanel;
