import React from "react";

// Danh sách phòng chat ở cột trái (avatar, tên, preview, badge unread)
const RoomList = ({
  rooms,
  loadingRooms,
  selectedRoomId,
  unreadCounts,
  onSelectRoom,
  resolveRoomAvatar,
  resolveRoomTitle,
}) => {
  return (
    <aside className="admin-chat-page__rooms">
      <div className="admin-chat-page__rooms-title">Danh sách phòng</div>
      {loadingRooms ? (
        <div className="admin-chat-page__empty">Đang tải...</div>
      ) : rooms.length === 0 ? (
        <div className="admin-chat-page__empty">Chưa có phòng chat nào.</div>
      ) : (
        rooms.map((room) => {
          // Tính trạng thái active/unread theo từng room
          const roomId = Number(room.RoomID);
          const unread = Number(unreadCounts[String(room.RoomID)] || 0);
          const isActive = Number(selectedRoomId || 0) === roomId;

          return (
            <button
              key={room.RoomID}
              type="button"
              className={`admin-chat-page__room ${isActive ? "active" : ""}`}
              onClick={() => onSelectRoom(room)}
            >
              <div className="admin-chat-page__room-avatar-wrapper">
                <img src={resolveRoomAvatar(room)} alt={resolveRoomTitle(room)} className="admin-chat-page__room-avatar" />
                {unread > 0 && <span className="admin-chat-page__room-badge">{unread}</span>}
              </div>
              <div className="admin-chat-page__room-content">
                <strong className={unread > 0 ? "admin-chat-page__room-title--unread" : ""}>{resolveRoomTitle(room)}</strong>
                <span className={unread > 0 ? "admin-chat-page__room-last-message--unread" : ""}>{room.LastMessageText || "Chưa có tin nhắn"}</span>
              </div>
            </button>
          );
        })
      )}
    </aside>
  );
};

export default RoomList;
