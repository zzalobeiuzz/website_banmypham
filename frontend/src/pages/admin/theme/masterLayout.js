import React, { useCallback, useEffect, useRef, useState } from "react";
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
    try {
      console.debug('[initAdminSocket] SOCKET_URL:', SOCKET_URL, 'hasToken:', Boolean(localStorage.getItem('accessToken')));
    } catch (e) {}
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

    try {
      socket.on('connect', () => { try { console.debug('[initAdminSocket] connected to', SOCKET_URL); } catch (e) {} });
      socket.on('connect_error', (err) => { try { console.debug('[initAdminSocket] connect_error', err && err.message); } catch (e) {} });
      socket.on('disconnect', (reason) => { try { console.debug('[initAdminSocket] disconnected', reason); } catch (e) {} });
    } catch (e) {}

    return socket;
  } catch (e) {
    return null;
  }
};

const isNotificationPayload = (payload) => {
  const messageType = String(payload?.MessageType || payload?.messageType || "").trim().toLowerCase();
  return (
    messageType === "notification" ||
    messageType === "notify" ||
    messageType === "system" ||
    messageType === "admin_notify" ||
    messageType === "admin-notify" ||
    Boolean(payload?.IsNotification)
  );
};

// import Sidebar from "./sidebar"; // Nếu có sidebar riêng, hãy import ở đây

const AdminMasterLayout = () => {
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [adminChatRooms, setAdminChatRooms] = useState([]);
  const adminChatRoomsRef = useRef([]);
  const adminAudioRef = useRef(null);
  const adminSoundWarmRef = useRef(false);
  const adminSoundKeyRef = useRef("");

  const getAdminSoundMuted = useCallback(() => {
    try {
      return localStorage.getItem("adminChatSoundMuted") === "true";
    } catch (e) {
      return false;
    }
  }, []);

  const resolveAdminSoundKey = useCallback((payload) => {
    const roomId = Number(payload?.RoomID || payload?.room?.RoomID || 0);
    const messageId = String(payload?.MessageID || payload?.id || payload?.MessageGUID || "").trim();
    const createdAt = String(payload?.CreatedAt || payload?.createdAt || "").trim();
    const senderId = String(payload?.SenderID || payload?.senderId || "").trim();
    const messageText = String(payload?.MessageText || payload?.messageText || payload?.text || "").trim();
    return `${roomId}:${messageId || createdAt || senderId || messageText}`;
  }, []);

  const initAdminAudio = useCallback(() => {
    if (adminAudioRef.current) return adminAudioRef.current;

    try {
      const src = (API_BASE || "").replace(/\/$/, "") + "/uploads/assets/sounds/notification.mp3";
      const audio = new Audio(`${src}?_=${Date.now()}`);
      audio.preload = "auto";
      audio.muted = getAdminSoundMuted();
      adminAudioRef.current = audio;
      return audio;
    } catch (e) {
      return null;
    }
  }, [getAdminSoundMuted]);

  const playAdminSound = useCallback((payload) => {
    if (getAdminSoundMuted()) return;

    const key = resolveAdminSoundKey(payload);
    if (key && adminSoundKeyRef.current === key) return;
    adminSoundKeyRef.current = key;

    const audio = initAdminAudio();
    if (!audio) return;

    try {
      audio.currentTime = 0;
      audio.muted = false;
      const result = audio.play();
      if (result && typeof result.catch === "function") {
        result.catch(() => {});
      }
    } catch (e) {}
  }, [getAdminSoundMuted, initAdminAudio, resolveAdminSoundKey]);

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
      adminChatRoomsRef.current = rooms;
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // ensure admin socket is initialized when admin layout mounts
    const s = initAdminSocket();
    syncUnreadStateFromRooms();

    // expose a global admin sound player so every admin page hears notifications
    try {
      window.__disableAdminSounds__ = false;
      window.__adminPlaySound__ = (payload) => playAdminSound(payload);
    } catch (e) {}

    try {
      initAdminAudio();
    } catch (e) {}

    const warmAdminSound = () => {
      try {
        if (adminSoundWarmRef.current) return;
        const audio = initAdminAudio();
        if (!audio || getAdminSoundMuted()) return;
        audio.muted = true;
        audio.play()
          .then(() => {
            try { audio.pause(); } catch (e) {}
            audio.muted = getAdminSoundMuted();
            adminSoundWarmRef.current = true;
          })
          .catch(() => {
            try { audio.muted = getAdminSoundMuted(); } catch (e) {}
          });
      } catch (e) {}
    };

    document.addEventListener("click", warmAdminSound, { once: true });
    document.addEventListener("touchstart", warmAdminSound, { once: true });

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
      adminChatRoomsRef.current = rooms;

      if (!Number.isNaN(total)) {
        setAdminUnreadCount(total);
      }
    };

    const handleAdminNotify = (payload) => {
      try {
        console.debug('[AdminMasterLayout] chat:admin-notify payload:', payload);
      } catch (e) {}
      if (isNotificationPayload(payload)) return;

      const roomId = Number(payload?.RoomID || payload?.room?.RoomID || 0);
      const senderRole = Number(payload?.senderRole || payload?.SenderRole || 0);
      const selectedRoomId = Number(window.__adminSelectedRoomId || 0);
      const openPopupCount = Number(window.__adminMiniChatOpenCount || 0);

      if (roomId && roomId === selectedRoomId && openPopupCount < 3) {
        return;
      }

      if (roomId && senderRole !== 1) {
        setAdminUnreadCount((prev) => prev + 1);
        syncUnreadStateFromRooms();

        const matchedRoom = adminChatRoomsRef.current.find((room) => Number(room?.RoomID || 0) === roomId);
        const sourceRoom = payload?.room || matchedRoom || payload;

        try {
          console.debug('[AdminMasterLayout] dispatching admin-auto-open-room for roomId:', roomId, 'sourceRoom:', sourceRoom);
        } catch (e) {}

        // play an alert sound for incoming user messages (admin-wide)
        try { if (typeof window.__adminPlaySound__ === 'function') window.__adminPlaySound__(payload); } catch (e) {}

        window.dispatchEvent(
          new CustomEvent("admin-auto-open-room", {
            detail: {
              ...sourceRoom,
              RoomID: roomId,
              __forceReload: true,
              __latestMessage: payload,
            },
          }),
        );
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
      s.on("chat:admin-notify", handleAdminNotify);
      s.on("chat:room-updated", handleRoomUpdated);
      s.on("chat:seen-updated", handleSeenUpdated);
    }

    return () => {
      document.body.style.overflow = "auto";
      try {
        window.removeEventListener("admin-unread-sync", handleUnreadSync);
        window.removeEventListener("admin-rooms-sync", handleRoomsSync);
        document.removeEventListener("click", warmAdminSound);
        document.removeEventListener("touchstart", warmAdminSound);
        delete window.__setAdminUnreadCount;
        if (window.__adminPlaySound__) delete window.__adminPlaySound__;
        if (s) {
          s.off("chat:admin-notify", handleAdminNotify);
          s.off("chat:room-updated", handleRoomUpdated);
          s.off("chat:seen-updated", handleSeenUpdated);
        }
        // remove resume handler if added
        try {
          if (window.__adminPlaySound__ && window.__adminPlaySound__._resumeHandler) {
            window.removeEventListener('click', window.__adminPlaySound__._resumeHandler);
            delete window.__adminPlaySound__._resumeHandler;
          }
        } catch (e) {}
      } catch (e) {}
    };
  }, [syncUnreadStateFromRooms, initAdminAudio, getAdminSoundMuted, playAdminSound]);

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