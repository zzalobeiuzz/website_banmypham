import React, { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./header";
import { io } from "socket.io-client";
import { API_BASE } from "../../../constants";

// Create a persistent admin socket so admin receives events across admin pages
const initAdminSocket = () => {
  try {
    // avoid creating multiple sockets
    if (window.__adminSocket__) return window.__adminSocket__;

    const SOCKET_URL = String(process.env.REACT_APP_SOCKET_URL || API_BASE || window.location.origin).replace(/\/$/, "");
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: {
        token: localStorage.getItem("accessToken"),
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // expose globally for other components to reuse
    window.__adminSocket__ = socket;

    return socket;
  } catch (e) {
    return null;
  }
};
// import Sidebar from "./sidebar"; // Nếu có sidebar riêng, hãy import ở đây

const AdminMasterLayout = () => {
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [adminChatRooms, setAdminChatRooms] = useState([]);

  const syncUnreadStateFromRooms = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/chat/admin/rooms`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });

      if (!response.ok) return;

      const payload = await response.json();
      const rooms = Array.isArray(payload?.data) ? payload.data : [];
      const total = rooms.reduce((sum, room) => sum + Number(room?.UnreadCount || 0), 0);

      setAdminUnreadCount(total);
      setAdminChatRooms(rooms);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // ensure admin socket is initialized when admin layout mounts
    const s = initAdminSocket();
    syncUnreadStateFromRooms();

    const handleUnreadSync = (event) => {
      const nextValue = Number(event?.detail || 0);
      if (!Number.isNaN(nextValue)) {
        setAdminUnreadCount(nextValue);
      }
    };

    const handleRoomsSync = (event) => {
      const rooms = Array.isArray(event?.detail?.rooms) ? event.detail.rooms : [];
      const total = Number(event?.detail?.totalUnread || 0);
      setAdminChatRooms(rooms);

      if (!Number.isNaN(total)) {
        setAdminUnreadCount(total);
      }
    };

    const handleChatMessage = (payload) => {
      const roomId = Number(payload?.RoomID || payload?.room?.RoomID || 0);
      const senderRole = Number(payload?.senderRole || payload?.SenderRole || 0);
      const selectedRoomId = Number(window.__adminSelectedRoomId || 0);

      if (roomId && roomId !== selectedRoomId && senderRole !== 1) {
        setAdminUnreadCount((prev) => prev + 1);
        syncUnreadStateFromRooms();
      }
    };

    const handleRoomUpdated = () => {
      syncUnreadStateFromRooms();
    };

    const handleSeenUpdated = () => {
      syncUnreadStateFromRooms();
    };

    window.__setAdminUnreadCount = (value) => {
      const nextValue = Number(value || 0);
      if (!Number.isNaN(nextValue)) setAdminUnreadCount(nextValue);
    };

    window.addEventListener("admin-unread-sync", handleUnreadSync);
    window.addEventListener("admin-rooms-sync", handleRoomsSync);

    if (s) {
      s.on("chat:message", handleChatMessage);
      s.on("chat:room-updated", handleRoomUpdated);
      s.on("chat:seen-updated", handleSeenUpdated);
    }

    return () => {
      document.body.style.overflow = "auto";
      try {
        window.removeEventListener("admin-unread-sync", handleUnreadSync);
        window.removeEventListener("admin-rooms-sync", handleRoomsSync);
        delete window.__setAdminUnreadCount;
        if (s) {
          s.off("chat:message", handleChatMessage);
          s.off("chat:room-updated", handleRoomUpdated);
          s.off("chat:seen-updated", handleSeenUpdated);
        }
      } catch (e) {}
    };
  }, [syncUnreadStateFromRooms]);

  return (
    <div
      className="home"
      style={{
        overflowY: "scroll",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header chatBadgeCount={adminUnreadCount} chatRooms={adminChatRooms} />
      <div style={{ display: "flex", flex: 1 }}>
        {/* <Sidebar /> */} {/* Bỏ comment nếu có sidebar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminMasterLayout;


// import React, { useEffect } from "react";
// import Header from "./header";

// const AdminMasterLayout = ({ children }) => {
//   useEffect(() => {
//     // Tắt thanh cuộn toàn trang
//     document.body.style.overflow = "hidden";
//     return () => {
//       document.body.style.overflow = "auto"; // Reset khi unmount
//     };
//   }, []);

//   return (
//     <div
//       className="home"
//       style={{
//         overflowY: "scroll",
//         height: "100vh",
//       }}
//     >
//       <Header />
//       {children}
//     </div>
//   );
// };

// export default AdminMasterLayout;