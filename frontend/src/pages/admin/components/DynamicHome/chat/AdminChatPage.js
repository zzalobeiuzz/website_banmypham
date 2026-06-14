import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import RoomList from "./components/RoomList";
import ConversationPanel from "./components/ConversationPanel";
import ChatCache from "./cache";
import "./admin-chat.scss";

// Trang chat quản trị: quản lý danh sách phòng, nội dung hội thoại và tương tác realtime.

const SOCKET_URL = String(process.env.REACT_APP_SOCKET_URL || API_BASE || window.location.origin).replace(/\/$/, "");

// Chuẩn hóa ID user để so sánh sender nhất quán
const resolveChatUserId = (value) => String(value || "").trim().toLowerCase();

// Tên hiển thị phòng chat
const resolveRoomTitle = (room) => {
  return String(room?.ParticipantName || room?.CreatedBy || room?.RoomKey || "").trim() || `Phòng #${room?.RoomID || ""}`;
};

// Avatar phòng chat (hỗ trợ URL tuyệt đối và đường dẫn upload nội bộ)
const resolveRoomAvatar = (room) => {
  const value = String(room?.ParticipantAvatar || "").trim();
  if (!value) return `${UPLOAD_BASE}/icons/icons8-web-account.png`;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  const normalized = value.replace(/^\/+/, "").replace(/^uploads\/?assets\/?/i, "");
  return `${UPLOAD_BASE}/${normalized}`;
};

// Định dạng thời gian khi click vào message (sử dụng UTC để giữ nguyên giờ từ DB):
// - Cùng ngày (theo UTC): chỉ giờ
// - Khác ngày: ngày + giờ (theo UTC)
const formatMessageTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isSameDayUTC =
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate();

  if (isSameDayUTC) {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(date);
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
};

const SettingsIcon = () => (
  <img
    src={`${UPLOAD_BASE}/icons/icons8-setting-96.png`}
    alt=""
    aria-hidden="true"
    className="chat-settings-icon"
    width="20"
    height="20"
  />
);

const AdminChatPage = () => {
  const { request } = useHttp();
  // Ref socket để emit/listen sự kiện realtime
  const socketRef = useRef(null);
  const messageEndRef = useRef(null);
  const selectedRoomIdRef = useRef(0);
  const fetchRoomsRef = useRef(null);
  // Track rooms that client explicitly cleared unread for — used to override server counts
  const clearedRoomsRef = useRef(new Set());
  // Dedupe recent admin notifications per-room to avoid counting the same message multiple times
  const recentNotifyIdsRef = useRef(new Map());
  // (roomsRef is declared after rooms state to avoid using rooms before it's defined)

  const currentUserId = useMemo(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      // prefer explicit email field if available, fall back to id/UserID
      return resolveChatUserId(storedUser?.email || storedUser?.id || storedUser?.UserID);
    } catch {
      return "";
    }
  }, []);

  const [rooms, setRooms] = useState([]);
  // Ref to latest rooms array to avoid stale closures inside socket handlers
  const roomsRef = useRef(rooms);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Đang kết nối...");
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const currentRoomId = useMemo(() => Number(selectedRoom?.RoomID || 0), [selectedRoom]);

  const messagesContainerRef = useRef(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const selectRoomRef = useRef(null);
  
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const skipAutoScrollRef = useRef(false);

  // Notification sound for admin
  const adminAudioRef = useRef(null);
  const [adminSoundMuted, setAdminSoundMuted] = useState(localStorage.getItem("adminChatSoundMuted") === "true");
  const [showSettings, setShowSettings] = useState(false);
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const adminSettingsRef = useRef(null);

  const initAdminAudio = useCallback(() => {
    // skip admin audio entirely when admin sounds are disabled
    if (window.__disableAdminSounds__) return;
    if (adminAudioRef.current) return;
    try {
      const src = (API_BASE || "").replace(/\/$/, "") + '/uploads/assets/sounds/notification.mp3';
      adminAudioRef.current = new Audio(src);
      adminAudioRef.current.preload = 'auto';
      adminAudioRef.current.muted = adminSoundMuted;
    } catch (e) {}
  }, [adminSoundMuted]);

  const tryPlayAdminNotification = useCallback((payload) => {
    try {
      if (typeof window.__adminPlaySound__ === "function") {
        window.__adminPlaySound__(payload);
        return;
      }
    } catch (e) {}

    if (window.__disableAdminSounds__) return;
    if (adminSoundMuted) return;
    if (!adminAudioRef.current) {
      initAdminAudio();
    }
    const a = adminAudioRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch (e) {}
  }, [adminSoundMuted, initAdminAudio]);

  // Init audio right away so admins can receive sounds without opening any room.
  useEffect(() => {
    try {
      if (!window.__disableAdminSounds__) {
        initAdminAudio();
        const a = adminAudioRef.current;
        if (a && !adminSoundMuted) {
          a.muted = true;
          a.play()
            .then(() => {
              try { a.pause(); } catch (e) {}
              a.muted = adminSoundMuted;
            })
            .catch(() => {
              try { a.muted = adminSoundMuted; } catch (e) {}
            });
        }
      }
    } catch (e) {}
  }, [initAdminAudio, adminSoundMuted]);

  // Warm up audio on first user interaction so browsers allow future play()
  useEffect(() => {
    const warm = () => {
      try {
        if (!window.__disableAdminSounds__) {
          initAdminAudio();
          const a = adminAudioRef.current;
          if (a) {
            // Play muted briefly to satisfy autoplay policies
            a.muted = true;
            a.play()
              .then(() => {
                try { a.pause(); } catch (e) {}
                a.muted = adminSoundMuted;
              })
              .catch(() => {
                try { a.muted = adminSoundMuted; } catch (e) {}
              });
          }
        }
      } catch (e) {}

      try {
        document.removeEventListener('click', warm);
        document.removeEventListener('touchstart', warm);
      } catch (e) {}
    };

    document.addEventListener('click', warm, { once: true });
    document.addEventListener('touchstart', warm, { once: true });

    return () => {
      try {
        document.removeEventListener('click', warm);
        document.removeEventListener('touchstart', warm);
      } catch (e) {}
    };
  }, [initAdminAudio, adminSoundMuted]);

  // Đồng bộ unread tổng và danh sách phòng cho header/layout admin
  const syncAdminUnreadAndRooms = (nextUnreadCounts, nextRooms) => {
    const totalUnread = Object.values(nextUnreadCounts).reduce((sum, value) => sum + Number(value || 0), 0);

    try {
      if (typeof window.__setAdminUnreadCount === "function") {
        window.__setAdminUnreadCount(totalUnread);
      } else {
        window.dispatchEvent(new CustomEvent("admin-unread-sync", { detail: totalUnread }));
      }

      window.dispatchEvent(
        new CustomEvent("admin-rooms-sync", {
          detail: {
            rooms: nextRooms,
            totalUnread,
          },
        }),
      );
    } catch (e) {
      // ignore
    }
  };

  

  useEffect(() => {
    selectedRoomIdRef.current = currentRoomId;
    window.__adminSelectedRoomId = currentRoomId;

    return () => {
      if (window.__adminSelectedRoomId === currentRoomId) {
        window.__adminSelectedRoomId = 0;
      }
    };
  }, [currentRoomId]);

  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((sum, value) => sum + Number(value || 0), 0);

    try {
      if (typeof window.__setAdminUnreadCount === "function") {
        window.__setAdminUnreadCount(totalUnread);
      } else {
        window.dispatchEvent(new CustomEvent("admin-unread-sync", { detail: totalUnread }));
      }
    } catch (e) {
      // ignore
    }
  }, [unreadCounts]);

  // close admin settings when clicking outside
  useEffect(() => {
    if (!showSettings) return undefined;
    const onDoc = (e) => {
      if (adminSettingsRef.current && !adminSettingsRef.current.contains(e.target)) {
        setShowSettings(false);
        setShowSoundMenu(false);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [showSettings]);

  const fetchRooms = React.useCallback(async () => {
    try {
      setLoadingRooms(true);
      const response = await request("GET", `${API_BASE}/api/chat/admin/rooms`);
      const roomData = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
      const activeRoomId = Number(selectedRoomIdRef.current || 0);

      const normalizedRooms = roomData.map((room) =>
        Number(room.RoomID) === activeRoomId ? { ...room, UnreadCount: 0 } : room,
      );

      // Build counts and apply client-cleared overrides
      setRooms(normalizedRooms);
      const counts = {};
      normalizedRooms.forEach((room) => {
        counts[String(room.RoomID)] = Number(room.UnreadCount || 0);
      });

      // Ensure rooms the client explicitly cleared stay zero until new messages arrive
      try {
        clearedRoomsRef.current.forEach((rid) => {
          counts[String(rid)] = 0;
        });
      } catch (e) {}
      setUnreadCounts(counts);

      syncAdminUnreadAndRooms(counts, normalizedRooms);
    } catch (error) {
      setConnectionStatus(error?.message || "Không thể tải danh sách phòng chat.");
    } finally {
      setLoadingRooms(false);
    }
  }, [request]);

  useEffect(() => {
    fetchRoomsRef.current = fetchRooms;
  }, [fetchRooms]);

  // Listen for mini-panel seen events to clear unread counts locally
  useEffect(() => {
    const onMiniSeen = (e) => {
      try {
        const roomId = Number(e?.detail?.roomId || 0);
        if (!roomId) return;
        clearedRoomsRef.current.add(roomId);
        setUnreadCounts((prev) => ({ ...prev, [String(roomId)]: 0 }));
        // also update rooms list UnreadCount
        setRooms((prev) => prev.map((r) => (Number(r.RoomID) === roomId ? { ...r, UnreadCount: 0 } : r)));
      } catch (e) {}
    };

    window.addEventListener('admin-mini-seen', onMiniSeen);
    return () => window.removeEventListener('admin-mini-seen', onMiniSeen);
  }, []);

  useEffect(() => {
    fetchRoomsRef.current?.();
  }, []);

  // Chuẩn hóa payload message socket/API về model dùng trong UI
  const normalizeMessage = useCallback((message) => {
    const id = String(message?.MessageID || message?.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    const roomId = Number(message?.RoomID || message?.room?.RoomID || 0);
    const senderId = resolveChatUserId(message?.SenderID || message?.senderId || "");
    const text = String(message?.MessageText || message?.text || "");
    // Support multiple possible createdAt field names returned from server
    const rawCreatedAt = message?.CreatedAt ?? message?.createdAt ?? message?.created_at ?? message?.Created_At;
    const createdAt = rawCreatedAt ? new Date(rawCreatedAt) : new Date();

    const senderRole = Number(message?.senderRole || message?.SenderRole || 0);
    // Determine if this message was sent by an admin/agent. Prefer explicit senderRole when available,
    // also treat explicit 'admin' senderId as admin, otherwise fall back to comparing senderId with currentUserId.
    const isAdminSender = senderRole === 1 || senderId === "admin" || (senderId && currentUserId && senderId === currentUserId);

    return { id, roomId, senderId, text, createdAt, senderRole, isAdminSender };
  }, [currentUserId]);

  // Loại message trùng theo id để tránh React warning và tin nhắn bị lặp
  const mergeUniqueMessages = (nextMessages) => {
    const seen = new Set();

    return nextMessages.filter((message) => {
      const key = String(message?.id || "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Lưu state tin nhắn của room hiện tại vào RAM để quay lại room thì dùng lại ngay
  useEffect(() => {
    if (!selectedRoom?.RoomID) return;

    try {
      ChatCache.setRoomCache(selectedRoom.RoomID, {
        messages,
        hasMoreOlder,
      });
    } catch (e) {
      // ignore
    }
  }, [selectedRoom?.RoomID, messages, hasMoreOlder]);

    // Khởi tạo socket và đăng ký toàn bộ sự kiện chat realtime cho admin
    useEffect(() => {
      const handleConnect = () => setConnectionStatus("Đã kết nối");
      const handleReconnect = () => setConnectionStatus("Đã kết nối (tự phục hồi)");
      const handleReconnectAttempt = () => setConnectionStatus("Đang thử kết nối lại...");
      const handleReconnectError = () => setConnectionStatus("Lỗi khi thử kết nối lại");
      const handleReconnectFailed = () => setConnectionStatus("Không thể kết nối lại");
      const handleDisconnect = () => setConnectionStatus("Mất kết nối");
      const handleConnectTimeout = () => setConnectionStatus("Kết nối timeout");

      const handleConnectError = (err) => {
        console.warn("[AdminChat] connect_error", err?.message || err);
        const errMsg = String(err?.message || err || "").toLowerCase();

        if (errMsg.includes("token") || errMsg.includes("không hợp lệ") || errMsg.includes("invalid")) {
          (async () => {
            try {
              const refreshToken = localStorage.getItem("refreshToken");
              if (!refreshToken) throw new Error("no-refresh-token");

              const resp = await fetch(`${API_BASE}/api/admin/refresh-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
              });

              if (!resp.ok) throw new Error(`refresh-failed:${resp.status}`);

              const data = await resp.json();
              if (data?.accessToken) {
                localStorage.setItem("accessToken", data.accessToken);
                try {
                  if (socketRef.current) socketRef.current.auth = { token: data.accessToken };
                } catch (e) {}
                try {
                  socketRef.current?.connect();
                } catch (e) {}
                setConnectionStatus("Làm mới phiên — đang kết nối lại...");
                return;
              }
            } catch (e) {
              console.warn("[AdminChat] token refresh failed", e);
            }

            setConnectionStatus("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
            try {
              window.dispatchEvent(new Event("open-login"));
            } catch (e) {}
          })();
          return;
        }

        setConnectionStatus(err?.message || "Lỗi kết nối");
      };

      const handleChatJoined = (payload) => {
        if (Number(payload?.room?.RoomID || 0) !== Number(selectedRoomIdRef.current || 0)) return;
        if (Array.isArray(payload?.messages)) {
          setHasMoreOlder((payload.messages || []).length > 0);
          setMessages(mergeUniqueMessages(payload.messages.map(normalizeMessage)));
        }
      };

      // Cập nhật preview phòng khi có tin nhắn mới
      const mergeRoomFromMessage = (roomId, payload, isSelectedRoom) => {
        // senderRole intentionally not used here; unread counts handled in notify
        const nextLastMessageText = payload?.MessageText || payload?.text || "";
        const nextLastMessageAt = new Date().toISOString();

        setRooms((prev) => {
          const updated = prev.map((room) => {
            if (Number(room.RoomID) !== roomId) return room;

            return {
              ...room,
              LastMessageText: nextLastMessageText || room.LastMessageText,
              LastMessageAt: nextLastMessageAt,
            };
          });

          const sorted = updated.sort((a, b) => {
            const aTime = new Date(a.LastMessageAt || a.UpdatedAt || a.CreatedAt || 0).getTime();
            const bTime = new Date(b.LastMessageAt || b.UpdatedAt || b.CreatedAt || 0).getTime();
            return bTime - aTime;
          });

          return sorted;
        });

        // NOTE: unread count is managed by admin notify event to avoid double-counting
      };

      // Nhận tin nhắn realtime
      const handleChatMessage = (payload) => {
        const roomId = Number(payload?.RoomID || payload?.room?.RoomID || 0);
        const senderRole = Number(payload?.senderRole || payload?.SenderRole || 0);

        mergeRoomFromMessage(roomId, payload, roomId === Number(selectedRoomIdRef.current || 0));

        if (roomId === Number(selectedRoomIdRef.current || 0)) {
          setMessages((prev) => mergeUniqueMessages([...prev, normalizeMessage(payload)]));
        }

        if (senderRole === 1) {
          return;
        }

        // Keep sound handling on the global admin-notify path to avoid duplicate playback.

        // Do not re-fetch full room list here; update local state only to avoid UI reset
      };

      // Global admin notification: arrives even when the room is not opened/joined yet
      const handleAdminNotify = (payload) => {
        const roomId = Number(payload?.RoomID || payload?.room?.RoomID || 0);
        const senderRole = Number(payload?.senderRole || payload?.SenderRole || 0);
        const openPopupCount = Number(window.__adminMiniChatOpenCount || 0);
        const isSelectedRoom = roomId === Number(selectedRoomIdRef.current || 0);

        if (isSelectedRoom && openPopupCount < 3) {
          return;
        }

        if (!roomId || senderRole === 1) return;

        mergeRoomFromMessage(roomId, payload, roomId === Number(selectedRoomIdRef.current || 0));

        // Increase unread count even when the room is open so the badge is visible for testing
        // and the notification button can be verified.
        const msgKey = String(payload?.MessageID || payload?.id || payload?.MessageGUID || `${roomId}_${payload?.CreatedAt || payload?.createdAt || Date.now()}`);
        try {
          const map = recentNotifyIdsRef.current;
          let set = map.get(roomId);
          if (!set) {
            set = new Set();
            map.set(roomId, set);
          }
          if (set.has(msgKey)) return;
          set.add(msgKey);
          // auto-expire the id after 30s
          setTimeout(() => {
            try {
              set.delete(msgKey);
              if (set.size === 0) map.delete(roomId);
            } catch (e) {}
          }, 30000);
        } catch (e) {}

        // New notification should remove any client-cleared override for that room
        try { clearedRoomsRef.current.delete(roomId); } catch (e) {}
        setUnreadCounts((prev) => {
          const key = String(roomId || "0");
          const prevCount = Number(prev[key] || 0);
          return { ...prev, [key]: prevCount + 1 };
        });

        // Play sound for every incoming customer message
        try {
          tryPlayAdminNotification(payload);
        } catch (e) {}

        // Do not re-fetch full room list here; update local state only to avoid UI reset
      };

      // Nhận cập nhật thông tin phòng (danh sách admin)
      const handleRoomUpdated = (payload) => {
        const updatedRoom = payload?.room;
        if (!updatedRoom?.RoomID) return;

        const roomIdNum = Number(updatedRoom.RoomID);
        const exists = Array.isArray(roomsRef.current) && roomsRef.current.some((room) => Number(room.RoomID) === roomIdNum);

        setRooms((prev) => {
          if (!exists) return [updatedRoom, ...prev];
          return prev.map((room) =>
            Number(room.RoomID) === roomIdNum ? { ...room, ...updatedRoom } : room,
          );
        });

        // Only refresh full list when a new room appears (exists === false)
        if (!exists) {
          try { fetchRoomsRef.current?.(); } catch (e) {}
        }
      };

      // socket init + event binding
      let createdLocalSocket = false;
      let socket = window.__adminSocket__ || null;

      if (!socket) {
        socket = io(SOCKET_URL, {
          transports: ["websocket"],
          auth: { token: localStorage.getItem("accessToken") },
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
        });
        window.__adminSocket__ = socket;
        createdLocalSocket = true;
      }

      socketRef.current = socket;

      // Đăng ký sự kiện socket
      socket.on("connect", handleConnect);
      socket.on("reconnect", handleReconnect);
      socket.on("reconnect_attempt", handleReconnectAttempt);
      socket.on("reconnect_error", handleReconnectError);
      socket.on("reconnect_failed", handleReconnectFailed);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      socket.on("connect_timeout", handleConnectTimeout);
      socket.on("chat:joined", handleChatJoined);
      socket.on("chat:message", handleChatMessage);
      socket.on("chat:admin-notify", handleAdminNotify);
      socket.on("chat:room-updated", handleRoomUpdated);

      return () => {
        try {
          socket.off("connect", handleConnect);
          socket.off("reconnect", handleReconnect);
          socket.off("reconnect_attempt", handleReconnectAttempt);
          socket.off("reconnect_error", handleReconnectError);
          socket.off("reconnect_failed", handleReconnectFailed);
          socket.off("disconnect", handleDisconnect);
          socket.off("connect_error", handleConnectError);
          socket.off("connect_timeout", handleConnectTimeout);
          socket.off("chat:joined", handleChatJoined);
          socket.off("chat:message", handleChatMessage);
          socket.off("chat:admin-notify", handleAdminNotify);
          socket.off("chat:room-updated", handleRoomUpdated);
        } catch (e) {}

        if (createdLocalSocket) {
          try {
            socket.disconnect();
          } catch (e) {}
          try {
            delete window.__adminSocket__;
          } catch (e) {}
        }

        socketRef.current = null;
      };
    }, [tryPlayAdminNotification, normalizeMessage]);

    


  // Khi danh sách message thay đổi thì auto scroll xuống cuối (trừ lúc đang prepend tin cũ)
  useEffect(() => {
    if (skipAutoScrollRef.current) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    if (showScrollToBottom) {
      container.scrollTop = container.scrollHeight;
      return;
    }

    const nearBottom = container
      ? container.scrollHeight - container.scrollTop - container.clientHeight <= 120
      : true;
    if (nearBottom && container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, showScrollToBottom]);

  // Chọn phòng chat: reset unread cục bộ và join room qua socket
  const selectRoom = async (room) => {
    const nextRoomId = Number(room.RoomID || 0);
    const nextRooms = rooms.map((currentRoom) =>
      Number(currentRoom.RoomID) === nextRoomId ? { ...currentRoom, UnreadCount: 0 } : currentRoom,
    );
    const nextUnreadCounts = {
      ...unreadCounts,
      [String(nextRoomId)]: 0,
    };

    setSelectedRoom(room);
    setSelectedMessageId(null);
    setUnreadCounts(nextUnreadCounts);
    setRooms(nextRooms);
    window.__adminSelectedRoomId = nextRoomId;

    // ensure ref used by fetchRooms is up-to-date so server response
    // will be normalized with this room marked as active (UnreadCount = 0)
    selectedRoomIdRef.current = nextRoomId;

    syncAdminUnreadAndRooms(nextUnreadCounts, nextRooms);

    // Reset room-local UI state when switching rooms
    setDraftMessage("");
    setShowScrollToBottom(false);
    setLoadingOlder(false);

    // Force the viewport to the latest message when switching/opening a room
    setShowScrollToBottom(true);

    // Keep track that client cleared this room's unread state
    try { clearedRoomsRef.current.add(nextRoomId); } catch (e) {}
    try { recentNotifyIdsRef.current.delete(nextRoomId); } catch (e) {}

    // Ưu tiên dữ liệu đã có trong RAM để quay lại room là hiện ngay, không bị trống.
    const cachedRoom = ChatCache.getRoomCache(nextRoomId);
    if (cachedRoom?.messages) {
      setMessages(mergeUniqueMessages(cachedRoom.messages));
      setHasMoreOlder(Boolean(cachedRoom.hasMoreOlder));
    } else {
      setMessages([]);
      setHasMoreOlder(true);
    }

    try {
      const socket = socketRef.current;
      if (!socket) return;

      socket.emit("chat:join", { roomId: room.RoomID }, (ack) => {
        if (ack?.success && Array.isArray(ack?.messages)) {
          const normalized = mergeUniqueMessages(ack.messages.map((m) => normalizeMessage(m)));
          setMessages(normalized);
          try {
            ChatCache.setRoomCache(room.RoomID, {
              messages: normalized,
              hasMoreOlder: normalized.length > 0,
            });
          } catch (e) {
            // ignore
          }
          // ensure container scrolls to bottom when first loading room
          requestAnimationFrame(() => {
            try {
              if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            } catch (e) {}
            try { setShowScrollToBottom(false); } catch (e) {}
          });
        }

        // Explicitly request server to mark this room as seen (idempotent)
        try {
          if (socketRef.current) socketRef.current.emit('chat:seen', { roomId: room.RoomID });
        } catch (e) {}
      });
    } catch (error) {
      setConnectionStatus(error?.message || "Không thể tải tin nhắn.");
    }
  };

  // Expose selectRoom via ref so external components (header) can instruct page to open a room
  selectRoomRef.current = selectRoom;

  useEffect(() => {
    const handleOpenRoom = (event) => {
      const room = event?.detail;
      if (!room?.RoomID) return;
      selectRoomRef.current?.(room);
    };

    window.addEventListener("admin-open-room", handleOpenRoom);
    return () => window.removeEventListener("admin-open-room", handleOpenRoom);
  }, []);

  // Tải thêm tin nhắn cũ khi cuộn lên đầu khung chat
  const loadOlderMessages = () => {
    if (!selectedRoom || !socketRef.current || loadingOlder || !hasMoreOlder) return;
    const socket = socketRef.current;
    const earliest = messages?.[0]?.createdAt;
    const before = earliest ? earliest.toISOString() : null;
    const limit = 50;
    setLoadingOlder(true);
    const prevScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
    // Request older messages
    socket.emit("chat:join", { roomId: selectedRoom.RoomID, before, limit }, (ack) => {
      try {
        if (ack?.success && Array.isArray(ack.messages) && ack.messages.length) {
          const older = mergeUniqueMessages(ack.messages.map(normalizeMessage));
          // prevent auto scroll to bottom
          skipAutoScrollRef.current = true;
          setMessages((prev) => mergeUniqueMessages([...older, ...prev]));
          try {
            ChatCache.setRoomCache(selectedRoom.RoomID, {
              messages: mergeUniqueMessages([...older, ...messages]),
              hasMoreOlder: ack.messages.length >= limit,
            });
          } catch (e) {
            // ignore
          }
          requestAnimationFrame(() => {
            try {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - prevScrollHeight;
              }
            } catch (e) {}
            // allow auto-scroll again shortly after
            setTimeout(() => (skipAutoScrollRef.current = false), 50);
          });

          if (ack.messages.length < limit) {
            setHasMoreOlder(false);
          }
        } else {
          setHasMoreOlder(false);
        }
      } finally {
        setLoadingOlder(false);
      }
    });
  };

  // Theo dõi cuộn để: 1) lazy-load tin cũ, 2) bật/tắt nút kéo xuống cuối
  const handleMessagesScroll = (e) => {
    try {
      const el = e.target;
      if (el.scrollTop <= 80) {
        loadOlderMessages();
      }
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 120;
      setShowScrollToBottom(!atBottom);
    } catch (e) {}
  };

  // Cuộn nhanh xuống cuối danh sách tin nhắn
  const scrollToBottom = () => {
    try {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      setShowScrollToBottom(false);
    } catch (e) {}
  };

  // Gửi tin nhắn hiện tại trong phòng đã chọn
  const sendMessage = () => {
    const text = String(draftMessage || "").trim();
    if (!text || !selectedRoom?.RoomID || !socketRef.current) return;

    socketRef.current.emit(
      "chat:send",
      { roomId: selectedRoom.RoomID, messageText: text, messageType: "text" },
      (ack) => {
        if (!ack?.success) {
          setConnectionStatus(ack?.message || "Không thể gửi tin nhắn.");
        }
      },
    );

    setDraftMessage("");
  };

  // Xóa tin nhắn (optimistic) - sẽ emit socket để backend xử lý nếu có
  const handleDeleteMessage = async (messageId) => {
    try {
      if (!messageId) return;
      // confirm
      if (!window.confirm || !window.confirm("Bạn có chắc muốn xóa tin nhắn này?")) return;

      // optimistic remove
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(messageId)));

      // notify backend via socket if possible
      try {
        if (socketRef.current && socketRef.current.connected && selectedRoom?.RoomID) {
          socketRef.current.emit("chat:delete", { roomId: selectedRoom.RoomID, messageId });
        }
      } catch (e) {
        console.warn("Emit chat:delete failed", e);
      }
    } catch (e) {
      console.warn("delete message failed", e);
    }
  };

  return (
    <div className="admin-chat-page">
      <div className="admin-chat-page__header">
        <div>
          <h2>Tư vấn khách hàng</h2>
          <p>{connectionStatus}</p>
        </div>
        <div className="admin-chat-page__header-actions" ref={adminSettingsRef}>
          <button
            type="button"
            className="admin-chat-page__settings-btn"
            onClick={() => {
              setShowSettings((s) => !s);
              setShowSoundMenu(false);
            }}
            title="Cài đặt chat"
            aria-label="Cài đặt chat"
          >
            <SettingsIcon />
          </button>

          {showSettings && (
            <div className="admin-chat-page__settings">
              <div className="admin-chat-page__settings-row">
                <span className="admin-chat-page__settings-label">Thông báo</span>
                <div className="admin-chat-page__settings-dropdown">
                  <button
                    type="button"
                    className="admin-chat-page__settings-trigger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSoundMenu((prev) => !prev);
                    }}
                    aria-haspopup="menu"
                    aria-expanded={showSoundMenu}
                  >
                    <span>{adminSoundMuted ? 'Tắt' : 'Bật'}</span>
                    <span className="admin-chat-page__settings-caret" aria-hidden="true">▾</span>
                  </button>

                  {showSoundMenu && (
                    <div className="admin-chat-page__settings-menu" role="menu">
                      <button
                        type="button"
                        className={`admin-chat-page__settings-option${adminSoundMuted ? '' : ' is-active'}`}
                        onClick={() => {
                          const next = false;
                          setAdminSoundMuted(next);
                          setShowSoundMenu(false);
                          try { localStorage.setItem('adminChatSoundMuted', 'false'); } catch (e) {}
                          try {
                            if (!adminAudioRef.current) initAdminAudio();
                            if (adminAudioRef.current) adminAudioRef.current.muted = next;
                          } catch (e) {}
                        }}
                      >
                        Bật
                      </button>
                      <button
                        type="button"
                        className={`admin-chat-page__settings-option${adminSoundMuted ? ' is-active' : ''}`}
                        onClick={() => {
                          const next = true;
                          setAdminSoundMuted(next);
                          setShowSoundMenu(false);
                          try { localStorage.setItem('adminChatSoundMuted', 'true'); } catch (e) {}
                          try {
                            if (!adminAudioRef.current) initAdminAudio();
                            if (adminAudioRef.current) adminAudioRef.current.muted = next;
                          } catch (e) {}
                        }}
                      >
                        Tắt
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="admin-chat-page__body">
        <RoomList
          rooms={rooms}
          loadingRooms={loadingRooms}
          selectedRoomId={selectedRoom?.RoomID}
          unreadCounts={unreadCounts}
          onSelectRoom={selectRoom}
          resolveRoomAvatar={resolveRoomAvatar}
          resolveRoomTitle={resolveRoomTitle}
        />

        <ConversationPanel
          key={`conv-${selectedRoom?.RoomID || 'none'}`}
          selectedRoom={selectedRoom}
          resolveRoomAvatar={resolveRoomAvatar}
          resolveRoomTitle={resolveRoomTitle}
          messages={messages}
          currentUserId={currentUserId}
          selectedMessageId={selectedMessageId}
          setSelectedMessageId={setSelectedMessageId}
          messagesContainerRef={messagesContainerRef}
          handleMessagesScroll={handleMessagesScroll}
          messageEndRef={messageEndRef}
          formatMessageTime={formatMessageTime}
          showScrollToBottom={showScrollToBottom}
          scrollToBottom={scrollToBottom}
          draftMessage={draftMessage}
          setDraftMessage={setDraftMessage}
          sendMessage={sendMessage}
          onDeleteMessage={handleDeleteMessage}
        />
      </div>
    </div>
  );
};

export default AdminChatPage;
