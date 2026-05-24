import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE, UPLOAD_BASE } from "../../../../constants";
import { useAuth } from "../../context/AuthContext";
import "./floatingChatIcon.scss";


//  ======================== SOCKET URL =================================   
const SOCKET_URL = String(
   API_BASE || window.location.origin,
).replace(/\/$/, "");

//  ======================== CHUẨN HÓA USER ID =================================   
const resolveChatUserId = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

/**
 * =========================================================
 * HIỂN THỊ LỖI THÂN THIỆN
 * =========================================================
 * Convert lỗi backend thành text dễ hiểu
 */
const getFriendlyChatErrorMessage = (message) => {
  console.log("Original chat error message:", message);

  const text = String(message || "").toLowerCase();

  /**
   * Lỗi SQL convert
   */
  if (
    text.includes("conversion failed") ||
    text.includes("nvarchar") ||
    text.includes("int")
  ) {
    return "Không thể gửi tin nhắn lúc này.";
  }

  /**
   * Lỗi socket/server
   */
  if (
    text.includes("connection refused") ||
    text.includes("failed to connect") ||
    text.includes("websocket")
  ) {
    return "Máy chủ chat đang tạm thời không kết nối được.";
  }

  return String(message || "Không thể gửi tin nhắn lúc này.");
};

const extractFirstUrl = (value) => {
  // Lấy URL đầu tiên trong đoạn text để tạo preview
  const text = String(value || "");
  const match = text.match(/https?:\/\/[^\s<>"]+/i);
  if (!match) return "";
  return match[0].replace(/[),.;!?]+$/, "");
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

// ======================== COMPONENT CHAT FLOATING =================================
const FloatingChatIcon = ({
  src = "http://localhost:5000/uploads/assets/icons/icons8-support-100.png",
  alt = "Chat",
  onClick,
}) => {
  const { user } = useAuth(); // Thông tin user hiện tại từ context
  const socketRef = useRef(null); // Ref lưu socket instance
  const messagesEndRef = useRef(null); // Ref để scroll đến tin nhắn mới nhất
  const [isOpen, setIsOpen] = useState(false);// Mở/đóng chat
  const [draftMessage, setDraftMessage] = useState("");  //  Nội dung đang nhập
  const [messages, setMessages] = useState([]);
  const messagesContainerRef = useRef(null);
  const skipAutoScrollRef = useRef(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const topSentinelRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const [room, setRoom] = useState(null);// Room chat hiện tại
  const [connectionStatus, setConnectionStatus] = useState("offline"); // Trạng thái kết nối
  const [isConnecting, setIsConnecting] = useState(false);// Đang kết nối socket
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  // Lưu preview cho ô nhập và cache preview của các URL đã tải
  const [draftPreview, setDraftPreview] = useState(null);
  const [previewCache, setPreviewCache] = useState({});
  // Notification sound
  const audioRef = useRef(null);
  const [soundMuted, setSoundMuted] = useState(localStorage.getItem("chatSoundMuted") === "true");
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const settingsRef = useRef(null);

  const initNotificationAudio = useCallback(() => {
    if (audioRef.current) return;
    try {
      const src = (API_BASE || "").replace(/\/$/, "") + '/uploads/assets/sounds/notification.mp3';
      audioRef.current = new Audio(src);
      audioRef.current.preload = 'auto';
      // keep muted until user explicitly enables sound
      audioRef.current.muted = soundMuted;
    } catch (e) {
      // ignore
    }
  }, [soundMuted]);

  const tryPlayNotification = useCallback(() => {
    if (soundMuted) return;
    const a = audioRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch (e) {}
  }, [soundMuted]);

  /**
   * =========================================================
   * USER ID HIỆN TẠI
   * =========================================================
   */
  const currentUserId = resolveChatUserId(user?.id || user?.UserID);

  /**
   * Kiểm tra đăng nhập
   */
  const isAuthenticated = Boolean(
    currentUserId && localStorage.getItem("accessToken"),
  );

  /**
   * =========================================================
   * CHUẨN HÓA TIN NHẮN
   * =========================================================
   */
  const normalizeMessage = useCallback(
    (message) => {
      const id = String(
        message?.MessageID ||
          message?.id ||
          `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      );

      const senderRole = Number(message?.senderRole || message?.SenderRole || 0);
      const role = senderRole === 1 || resolveChatUserId(message?.SenderID || "") !== currentUserId ? "agent" : "user";

      const text = String(message?.MessageText || message?.text || "");

      const rawCreatedAt = message?.CreatedAt;
      const createdAt = rawCreatedAt ? new Date(rawCreatedAt) : new Date();

      // Debug logging to diagnose timezone/parse issues (remove in production)
      try {
        console.debug("[FloatingChat] normalizeMessage", { rawCreatedAt, parsed: createdAt.toString(), tzOffsetMin: createdAt.getTimezoneOffset() });
      } catch (e) {
        // ignore
      }

      return { id, role, text, createdAt };
    },
    [currentUserId],
  );

    const mergeUniqueMessages = useCallback((nextMessages) => {
      const seen = new Set();
      return nextMessages.filter((m) => {
        const k = String(m?.id || m?.MessageID || "");
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }, []);

  const fetchLinkPreview = useCallback(async (url) => {
    // Gọi backend để lấy title, ảnh và mô tả của link
    const previewUrl = extractFirstUrl(url);
    if (!previewUrl) return null;

    const cached = previewCache[previewUrl];
    if (cached) return cached;

    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_BASE}/api/chat/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url: previewUrl }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || "Không thể tải xem trước liên kết.");
    }

    return data.data;
  }, [previewCache]);

  useEffect(() => {
    // Khi người dùng dán link vào ô chat thì tự lấy preview
    const previewUrl = extractFirstUrl(draftMessage);

    if (!previewUrl) {
      setDraftPreview(null);
      return undefined;
    }

    if (previewCache[previewUrl]) {
      setDraftPreview(previewCache[previewUrl]);
      return undefined;
    }

    let active = true;

    (async () => {
      try {
        const preview = await fetchLinkPreview(previewUrl);
        if (!active || !preview) return;
        setPreviewCache((prev) => ({ ...prev, [previewUrl]: preview }));
        setDraftPreview(preview);
      } catch (error) {
        if (!active) return;
        setDraftPreview(null);
      }
    })();

    return () => {
      active = false;
    };
  }, [draftMessage, fetchLinkPreview, previewCache]);

  useEffect(() => {
    // Mỗi tin nhắn có URL sẽ dùng chung preview đã cache
    const urls = Array.from(
      new Set(messages.map((message) => extractFirstUrl(message.text)).filter(Boolean)),
    );

    const pendingUrls = urls.filter((url) => !previewCache[url]);
    if (pendingUrls.length === 0) return undefined;

    let active = true;

    (async () => {
      for (const url of pendingUrls) {
        try {
          const preview = await fetchLinkPreview(url);
          if (!active || !preview) continue;
          setPreviewCache((prev) => (prev[url] ? prev : { ...prev, [url]: preview }));
        } catch (error) {
          // ignore preview failures so chat keeps working
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [messages, fetchLinkPreview, previewCache]);

  const resolveAvatarSrc = (avatar) => {
    const value = String(avatar || "").trim();
    if (!value) return `${UPLOAD_BASE}/icons/icons8-web-account.png`;
    if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

    const normalized = value.replace(/^\/+/, "").replace(/^uploads\/?assets\/?/i, "");
    return `${UPLOAD_BASE}/${normalized}`;
  };

  const resolveSupportIcon = () => `${UPLOAD_BASE}/icons/icons8-support-100.png`;

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

  const markCurrentRoomAsSeen = useCallback((roomId) => {
    if (!roomId || !socketRef.current) return;

    try {
      socketRef.current.emit("chat:seen", { roomId });
    } catch (e) {
      // ignore
    }
  }, []);

  /**
   * =========================================================
   * SOCKET CONNECTION
   * =========================================================
   */
  useEffect(() => {
    console.log("Đang connect socket");

    // Nếu chưa xác thực thì không khởi tạo socket (tránh load dữ liệu của user trước)
    if (!isAuthenticated) {
      setConnectionStatus("Bạn cần đăng nhập để chat.");
      setMessages([]);
      return () => {};
    }

    let mounted = true;

    // Khởi tạo kết nối với cấu hình reconnect
    const socket = io(SOCKET_URL, {
      // Chỉ cho phép kết nối bằng WebSocket
      transports: ["websocket"],
      // Gửi token để kiểm tra xác thực khi kết nối
      auth: {
        token: localStorage.getItem("accessToken"),
      },
      // Reconnection options
      // Cấu hình dưới đây giúp client tự động thử kết nối lại khi mạng bị ngắt
      // (ví dụ: máy sleep, chuyển mạng). Các giá trị có thể điều chỉnh theo thực tế.
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Lưu socket instance vào ref để dùng ở các function khác
    socketRef.current = socket;

    setIsConnecting(true);

    setConnectionStatus("Đang kết nối...");

    /**
     * =====================================================
     *        LẮNG NGHE CÁC SỰ KIỆN TỪ SERVER
     * =====================================================
     */
    // === KẾT NỐI THÀNH CÔNG ====
    socket.on("connect", () => {
      console.log("Kết nối Socket thành công:", socket.id);
      if (!mounted) return;
      setConnectionStatus("Đã kết nối");
    });

    // Handlers lifecycle: log và cập nhật trạng thái khi socket tự reconnect
    socket.on("reconnect", (attempt) => {
      console.debug("[FloatingChat] socket reconnect", attempt);
      setConnectionStatus("Đã kết nối (tự phục hồi)");
    });

    socket.on("reconnect_attempt", (attempt) => {
      console.debug("[FloatingChat] reconnect_attempt", attempt);
      setConnectionStatus("Đang thử kết nối lại...");
    });

    socket.on("reconnect_error", (err) => {
      console.warn("[FloatingChat] reconnect_error", err);
      setConnectionStatus("Lỗi khi thử kết nối lại");
    });

    socket.on("reconnect_failed", () => {
      console.warn("[FloatingChat] reconnect_failed");
      setConnectionStatus("Không thể kết nối lại");
    });

    // Khi connect_error xảy ra, kiểm tra nếu lỗi liên quan token thì tự động
    // gọi API refresh-token để lấy accessToken mới và thử kết nối lại.
    // Nếu không thể refresh thì yêu cầu user đăng nhập lại.
    socket.on("connect_error", (err) => {
      console.warn("[FloatingChat] connect_error", err?.message || err);
      const errMsg = String(err?.message || err || "").toLowerCase();
      // Nếu lỗi liên quan token, thử flow refresh
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
              // Lưu accessToken mới và cập nhật auth cho socket trước khi connect
              localStorage.setItem("accessToken", data.accessToken);
              try { socket.auth = { token: data.accessToken }; } catch (e) {}
              socket.connect();
              setConnectionStatus("Làm mới phiên — đang kết nối lại...");
              return;
            }
          } catch (e) {
            console.warn("[FloatingChat] token refresh failed", e);
          }

          // Nếu refresh không thành công, yêu cầu user đăng nhập lại
          setConnectionStatus("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
          try { window.dispatchEvent(new Event("open-login")); } catch (e) {}
        })();
        return;
      }

      setConnectionStatus(err?.message || "Lỗi kết nối");
    });

    socket.on("connect_timeout", (timeout) => {
      console.warn("[FloatingChat] connect_timeout", timeout);
      setConnectionStatus("Kết nối timeout");
    });

    // === MẤT KẾT NỐI ===
    socket.on("disconnect", () => {
      console.log("Mất kết nối Socket:", socket.id);
      if (!mounted) return;
      setConnectionStatus("Mất kết nối");
    });

    // === SẲN SÀNG CHAT ===
    socket.on("chat:ready", (payload) => {
      console.log("Sẳn sàng chat:", socket.id);
      if (!mounted) return;
      // * 1. Nhận thông tin được trả về 

      const nextRoom = payload?.room || null;
      console.log("Chat ready with room:", nextRoom);
      // Chuẩn hóa tin nhắn cũ (nếu có) and keep only last page to avoid loading whole history
      const limit = 15;
      const nextMessages = Array.isArray(payload?.messages)
        ? payload.messages.map(normalizeMessage)
        : [];

      // Cập nhật room và tin nhắn vào state
      setRoom(nextRoom);
      setSelectedMessageId(null);
      if (isOpen && nextRoom?.RoomID) {
        markCurrentRoomAsSeen(nextRoom.RoomID);
      }

      if (nextMessages.length > 0) {
        if (nextMessages.length > limit) {
          setMessages(nextMessages.slice(-limit));
          setHasMoreOlder(true);
        } else {
          setMessages(nextMessages);
          setHasMoreOlder(nextMessages.length >= limit);
        }
      } else {
        // seed a friendly message when there's no history
        setMessages([
          {
            id: `welcome_admin_${Date.now()}`,
            role: "agent",
            text: "Xin chào, mình có thể hỗ trợ gì cho bạn?",
            createdAt: new Date(),
          },
        ]);
        setHasMoreOlder(false);
      }

      setConnectionStatus("Sẵn sàng chat");

      setIsConnecting(false);

      // Server already joined the support room for this user.
      // Avoiding an immediate extra chat:join saves one DB fetch and
      // makes the initial connection feel faster.
    });

    // === THAM GIA PHÒNG CHAT ===
    socket.on("chat:joined", (payload) => {
      // Kiểm tra nếu component đã unmounted
      if (!mounted) return;

      // Cập nhật room mới nếu có
      if (payload?.room) {
        setRoom(payload.room);
        if (isOpen && payload.room?.RoomID) {
          markCurrentRoomAsSeen(payload.room.RoomID);
        }
      }

      setSelectedMessageId(null);

      // Cập nhật tin nhắn cũ nếu có — only keep recent page-sized chunk
      try {
        const limit = 15;
        if (Array.isArray(payload?.messages) && payload.messages.length > 0) {
          const normalized = payload.messages.map(normalizeMessage);
          if (normalized.length > limit) {
            const last = normalized.slice(-limit);
            setMessages(last);
            setHasMoreOlder(true);
          } else {
            setMessages(normalized);
            setHasMoreOlder(normalized.length >= limit);
          }
        }
      } catch (e) {
        if (Array.isArray(payload?.messages) && payload.messages.length > 0) {
          setMessages(payload.messages.map(normalizeMessage));
        }
      }

      setConnectionStatus("Sẵn sàng chat");

      setIsConnecting(false);
    });

    /**
     * =====================================================
     * NHẬN TIN NHẮN MỚI
     * =====================================================
     */
    socket.on("chat:message", (payload) => {
      if (!mounted) return;

      /**
       * Kiểm tra room
       */
      const payloadRoomId = Number(
        payload?.RoomID || payload?.room?.RoomID || 0,
      );

      if (room?.RoomID && Number(room.RoomID) !== payloadRoomId) {
        return;
      }

      setMessages((prev) => {
        const nextMessage = normalizeMessage(payload);

        // tránh duplicate
        if (prev.some((item) => String(item.id) === String(nextMessage.id))) {
          return prev;
        }

        // Nếu panel đang đóng và tin nhắn từ agent (không phải user), tăng badge
        if (!isOpen && nextMessage.role !== "user") {
          setUnreadCount((c) => {
            const next = c + 1;
            try {
              console.debug("[FloatingChat] increment unreadCount", { prev: c, next });
            } catch (e) {}
            return next;
          });

          // Try to play notification sound when panel closed and message from agent
          tryPlayNotification();
        }

        return [...prev, nextMessage];
      });
    });

    // Xóa tin nhắn: handler nhận từ UI
    const handleDeleteRequest = ({ messageId }) => {
      try {
        if (!messageId) return;
        // optimistic remove
        setMessages((prev) => prev.filter((m) => String(m.id) !== String(messageId)));
      } catch (e) {
        console.warn("handleDeleteRequest failed", e);
      }
    };

    socket.on("chat:message-deleted", handleDeleteRequest);

    /**
     * =====================================================
     * CHAT ERROR
     * =====================================================
     */
    socket.on("chat:error", (payload) => {
      if (!mounted) return;

      setConnectionStatus(
        getFriendlyChatErrorMessage(payload?.message || "Có lỗi kết nối chat"),
      );

      setIsConnecting(false);
    });

    /**
     * =====================================================
     * CLEANUP
     * =====================================================
     */
    return () => {
      mounted = false;

      socket.removeAllListeners();

      socket.disconnect();

      socketRef.current = null;
    };
  }, [isOpen, isAuthenticated, currentUserId, normalizeMessage, room?.RoomID, markCurrentRoomAsSeen, tryPlayNotification]);

  // Nếu token bị xóa hoặc isAuthenticated thay đổi thành false, clear state và disconnect
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        setMessages([]);
        setRoom(null);
        setSelectedMessageId(null);
        setUnreadCount(0);
        setDraftMessage("");
        if (socketRef.current) {
          try { socketRef.current.removeAllListeners(); } catch (e) {}
          try { socketRef.current.disconnect(); } catch (e) {}
          socketRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    }
  }, [isAuthenticated]);


  // Khi người dùng mở panel chat, ép reconnect ngay lập tức nếu socket đang trong trạng thái disconnected.
  // Việc này hữu ích sau khi máy sleep/khôi phục mạng: mở panel sẽ kích hoạt kết nối lại.
  useEffect(() => {
    if (isOpen && socketRef.current && !socketRef.current.connected) {
      try {
        console.debug("[FloatingChat] opening panel — forcing socket.connect()");
        // Cập nhật token (nếu thay đổi) trước khi connect, để server nhận auth mới khi reconnect
        try { socketRef.current.auth = { token: localStorage.getItem("accessToken") }; } catch (e) {}
        socketRef.current.connect();
      } catch (e) {
        console.warn("[FloatingChat] socket.connect() failed", e);
      }
    }
  }, [isOpen]);

  // Khi user logout (user từ context trở về null), xóa toàn bộ tin nhắn lưu trong state và đóng socket
  useEffect(() => {
    if (!user) {
      try {
        setMessages([]);
        setRoom(null);
        setSelectedMessageId(null);
        setUnreadCount(0);
        setDraftMessage("");
        if (socketRef.current) {
          try { socketRef.current.removeAllListeners(); } catch (e) {}
          try { socketRef.current.disconnect(); } catch (e) {}
          socketRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    }
  }, [user]);

  // Nếu logout được thực hiện bằng cách thay đổi localStorage trực tiếp (hoặc ở tab khác),
  // lắng nghe sự kiện để đảm bảo clear state chat.
  useEffect(() => {
    const handleUserUpdated = () => {
      try {
        const stored = localStorage.getItem("user");
        if (!stored) {
          setMessages([]);
          setRoom(null);
          setSelectedMessageId(null);
          setUnreadCount(0);
          setDraftMessage("");
          if (socketRef.current) {
            try { socketRef.current.removeAllListeners(); } catch (e) {}
            try { socketRef.current.disconnect(); } catch (e) {}
            socketRef.current = null;
          }
        }
      } catch (e) {
        // ignore
      }
    };

    const onStorage = (e) => {
      if (e.key === "user" && !e.newValue) handleUserUpdated();
    };

    window.addEventListener("user-updated", handleUserUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("user-updated", handleUserUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Lắng nghe sự kiện visibilitychange / online để cố gắng reconnect khi tab trở về foreground
  // hoặc máy vừa bật lại mạng. Giúp client tự phục hồi mà không cần user thao tác.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && socketRef.current && !socketRef.current.connected) {
        try { socketRef.current.connect(); } catch (e) {}
      }
    };
    const onOnline = () => {
      if (socketRef.current && !socketRef.current.connected) {
        try { socketRef.current.connect(); } catch (e) {}
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  // Reset unread count when user opens the chat panel
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !room?.RoomID || !socketRef.current) return;

    markCurrentRoomAsSeen(room.RoomID);
  }, [isOpen, room?.RoomID, markCurrentRoomAsSeen]);

  // Debug log unreadCount changes (temporary)
  useEffect(() => {
    try {
      console.debug("[FloatingChat] unreadCount changed", { unreadCount, isOpen });
    } catch (e) {}
  }, [unreadCount, isOpen]);

  // Update document title as a fallback indicator for unread messages
  useEffect(() => {
    try {
      const original = document.title.replace(/^\(\d+\+?\)\s*/, "");
      if (unreadCount > 0) {
        document.title = `(${unreadCount > 99 ? "99+" : unreadCount}) ${original}`;
      } else {
        document.title = original;
      }
    } catch (e) {}
  }, [unreadCount]);

  /**
   * =========================================================
   * AUTO SCROLL
   * =========================================================
   */
  useEffect(() => {
    try {
      if (skipAutoScrollRef.current) {
        // When we just prepended older messages we set this flag to avoid
        // auto-scrolling to bottom. The flag will be cleared shortly after.
        return;
      }

      if (messagesEndRef.current && isOpen) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (e) {}
  }, [messages, isOpen]);

  /**
   * =========================================================
   * CLICK ICON CHAT
   * =========================================================
   */
  const handleClick = () => {
    /**
     * Nếu có callback ngoài
     */
    if (typeof onClick === "function") {
      onClick();

      return;
    }

    // If not authenticated, open login popup immediately and don't open chat panel
    if (!isAuthenticated) {
      try { window.dispatchEvent(new Event("open-login")); } catch (e) {}
      return;
    }

    // Initialize audio on first user gesture so browsers allow future play
    if (!soundUnlocked) {
      try {
        initNotificationAudio();
        const a = audioRef.current;
        if (a) {
          a.muted = true;
          a.play()
            .then(() => {
              try { a.pause(); } catch (e) {}
              a.muted = soundMuted;
              setSoundUnlocked(true);
            })
            .catch(() => setSoundUnlocked(true));
        } else {
          setSoundUnlocked(true);
        }
      } catch (e) {
        setSoundUnlocked(true);
      }
    }

    // Toggle open
    setIsOpen((prev) => {
      const nextOpen = !prev;

      if (nextOpen && room?.RoomID) {
        markCurrentRoomAsSeen(room.RoomID);

        // Explicitly request a limited page of messages to avoid loading full history
        try {
          const socket = socketRef.current;
          if (socket && socket.connected) {
            const limit = 15;
            socket.emit('chat:join', { roomId: room.RoomID, limit }, (ack) => {
              try {
                if (ack?.success && Array.isArray(ack.messages)) {
                  const normalized = ack.messages.map(normalizeMessage);
                  if (normalized.length > limit) {
                    setMessages(normalized.slice(-limit));
                    setHasMoreOlder(true);
                  } else {
                    setMessages(normalized);
                    setHasMoreOlder(normalized.length >= limit);
                  }
                }
              } catch (e) {}
            });
          }
        } catch (e) {}
      }

      return nextOpen;
    });
  };

  // close settings when clicking outside
  useEffect(() => {
    if (!showSettings) return undefined;
    const onDoc = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
        setShowSoundMenu(false);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [showSettings]);

  /**
   * =========================================================
   * GỬI TIN NHẮN
   * =========================================================
   */
  const sendMessage = () => {
    /**
     * Trim message
     */
    const text = String(draftMessage || "").trim();

    /**
     * Validate
     */
    if (!text || !room?.RoomID || !socketRef.current) {
      return;
    }

    /**
     * clear input
     */
    setDraftMessage("");

    /**
     * emit socket
     */
    socketRef.current.emit(
      "chat:send",

      {
        roomId: room.RoomID,
        messageText: text,
        messageType: "text",
      },

      /**
       * callback ack
       */
      (ack) => {
        if (!ack?.success) {
          setConnectionStatus(getFriendlyChatErrorMessage(ack?.message));
        }
      },
    );
  };

  const renderPreviewCard = (preview) => {
    if (!preview) return null;

    return (
      <a
        className="floating-chat-panel__preview-card"
        href={preview.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={preview.title || preview.siteName || preview.url || "Mở liên kết"}
      >
        {preview.image && (
          <div className="floating-chat-panel__preview-thumb">
            <img src={preview.image} alt={preview.title || preview.siteName || "preview"} />
          </div>
        )}
        <div className="floating-chat-panel__preview-body">
          {preview.siteName && (
            <div className="floating-chat-panel__preview-site">{preview.siteName}</div>
          )}
          {preview.title && (
            <div className="floating-chat-panel__preview-title">{preview.title}</div>
          )}
          {preview.description && (
            <div className="floating-chat-panel__preview-description">{preview.description}</div>
          )}
        </div>
      </a>
    );
  };

  const loadOlderMessages = useCallback(() => {
    try {
      if (!room?.RoomID || !socketRef.current || loadingOlder || !hasMoreOlder) {
        console.debug('[FloatingChat] loadOlderMessages prevented:', { roomId: room?.RoomID, socket: !!socketRef.current, loadingOlder, hasMoreOlder });
        return;
      }
      const earliest = messages?.[0]?.createdAt;
      const before = earliest ? new Date(earliest).toISOString() : null;
      const limit = 15;
      console.debug('[FloatingChat] loadOlderMessages emit', { roomId: room.RoomID, before, limit });
      setLoadingOlder(true);
      try { if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current); } catch (e) {}
      loadingTimeoutRef.current = setTimeout(() => {
        try { setLoadingOlder(false); } catch (e) {}
      }, 5000);
      const prevScrollHeight = messagesContainerRef.current?.scrollHeight || 0;

      socketRef.current.emit('chat:join', { roomId: room.RoomID, before, limit }, (ack) => {
        try {
          console.debug('[FloatingChat] chat:join ack', ack && { success: ack.success, messagesLength: Array.isArray(ack.messages) ? ack.messages.length : 0 });
          if (ack?.success && Array.isArray(ack.messages) && ack.messages.length) {
            const older = mergeUniqueMessages(ack.messages.map(normalizeMessage));
            skipAutoScrollRef.current = true;
            setMessages((prev) => mergeUniqueMessages([...older, ...prev]));
            requestAnimationFrame(() => {
              try {
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - prevScrollHeight;
                }
              } catch (e) {}
              setTimeout(() => (skipAutoScrollRef.current = false), 50);
            });

            if (ack.messages.length < limit) setHasMoreOlder(false);
          } else {
            setHasMoreOlder(false);
          }
        } finally {
          setLoadingOlder(false);
          try { if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; } } catch (e) {}
        }
      });
    } catch (e) {
      setLoadingOlder(false);
      try { if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; } } catch (e) {}
    }
  }, [room?.RoomID, loadingOlder, hasMoreOlder, messages, normalizeMessage, mergeUniqueMessages]);

  const handleMessagesScroll = (e) => {
    try {
      const el = e.target;
      if (el.scrollTop <= 80) {
        loadOlderMessages();
      }
    } catch (e) {}
  };

  // Use an IntersectionObserver on a top sentinel as a more reliable trigger
  useEffect(() => {
    try {
      const container = messagesContainerRef.current;
      const sentinel = topSentinelRef.current;
      if (!container || !sentinel) return undefined;

      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadOlderMessages();
          }
        });
      }, { root: container, threshold: 0.1 });

      io.observe(sentinel);

      return () => {
        try { io.disconnect(); } catch (e) {}
      };
    } catch (e) {
      return undefined;
    }
  }, [messagesContainerRef, topSentinelRef, hasMoreOlder, loadingOlder, room?.RoomID, loadOlderMessages]);

  return (
    <>
      {isOpen && (
        <div className="floating-chat-panel">
          <div className="floating-chat-panel__header">
            <div>
              <div className="floating-chat-panel__title">
                Hỗ trợ trực tuyến
              </div>
              <div className="floating-chat-panel__status">
                {connectionStatus || "Phản hồi nhanh cho bạn"}
              </div>
            </div>
            <div className="floating-chat-panel__header-actions">
              <div className="floating-chat-panel__header-settings" ref={settingsRef}>
                <button
                  type="button"
                  className="floating-chat-panel__settings-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettings((s) => !s);
                    setShowSoundMenu(false);
                  }}
                  title="Cài đặt chat"
                  aria-label="Cài đặt chat"
                >
                  <SettingsIcon />
                </button>

                {showSettings && (
                  <div className="floating-chat-panel__settings">
                    <div className="floating-chat-panel__settings-row">
                      <span className="floating-chat-panel__settings-label">Thông báo</span>
                      <div className="floating-chat-panel__settings-dropdown">
                        <button
                          type="button"
                          className="floating-chat-panel__settings-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSoundMenu((prev) => !prev);
                          }}
                          aria-haspopup="menu"
                          aria-expanded={showSoundMenu}
                        >
                          <span>{soundMuted ? 'Tắt' : 'Bật'}</span>
                          <span className="floating-chat-panel__settings-caret" aria-hidden="true">▾</span>
                        </button>

                        {showSoundMenu && (
                          <div className="floating-chat-panel__settings-menu" role="menu">
                            <button
                              type="button"
                              className={`floating-chat-panel__settings-option${soundMuted ? '' : ' is-active'}`}
                              onClick={() => {
                                const next = false;
                                setSoundMuted(next);
                                setShowSoundMenu(false);
                                try { localStorage.setItem('chatSoundMuted', 'false'); } catch (e) {}
                                try { if (audioRef.current) audioRef.current.muted = next; } catch (e) {}
                              }}
                            >
                              Bật
                            </button>
                            <button
                              type="button"
                              className={`floating-chat-panel__settings-option${soundMuted ? ' is-active' : ''}`}
                              onClick={() => {
                                const next = true;
                                setSoundMuted(next);
                                setShowSoundMenu(false);
                                try { localStorage.setItem('chatSoundMuted', 'true'); } catch (e) {}
                                try { if (audioRef.current) audioRef.current.muted = next; } catch (e) {}
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

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng chat"
                className="floating-chat-panel__close"
              >
                ×
              </button>
            </div>
          </div>

          <div className="floating-chat-panel__messages" ref={messagesContainerRef} onScroll={handleMessagesScroll}>
            <div ref={topSentinelRef} className="floating-chat-panel__top-sentinel" aria-hidden />
            {loadingOlder && (
              <div className="floating-chat-panel__loading-older">Đang tải...</div>
            )}
            {messages.map((message) => {
              const isUser = message.role === "user";
              const messagePreviewUrl = extractFirstUrl(message.text);
              const messagePreview = messagePreviewUrl ? previewCache[messagePreviewUrl] : null;
              const isOnlyLink = messagePreviewUrl && message.text && message.text.trim() === messagePreviewUrl;

              return (
                <React.Fragment key={message.id}>
                  <div
                    className={`floating-chat-panel__message-row floating-chat-panel__message-row--${message.role}`}
                    style={{ position: "relative" }}
                  >
                    {/* Render bubble / avatar / actions in the row */}
                    {isUser ? (
                      <>
                        <div className="floating-chat-panel__actions" aria-hidden>
                          <button
                            type="button"
                            className="floating-chat-panel__action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!window.confirm || !window.confirm("Bạn có chắc muốn xóa tin nhắn này?")) return;
                              setMessages((prev) => prev.filter((m) => String(m.id) !== String(message.id)));
                              try {
                                if (socketRef.current && socketRef.current.connected && room?.RoomID) {
                                  socketRef.current.emit("chat:delete", { roomId: room.RoomID, messageId: message.id });
                                }
                              } catch (e) {
                                console.warn("emit chat:delete failed", e);
                              }
                            }}
                            title="Xóa tin nhắn"
                          >
                            …
                          </button>
                        </div>

                        {isOnlyLink && messagePreview ? (
                          <div className="floating-chat-panel__message-preview floating-chat-panel__message-preview--user floating-chat-panel__message-preview--inline">
                            {renderPreviewCard(messagePreview)}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="floating-chat-panel__bubble"
                            onClick={() => setSelectedMessageId((prev) => (prev === message.id ? null : message.id))}
                          >
                            <span className="floating-chat-panel__message-text">{message.text}</span>
                            {selectedMessageId === message.id && (
                              <span className="floating-chat-panel__message-time">{formatMessageTime(message.createdAt)}</span>
                            )}
                          </button>
                        )}

                        <img src={resolveAvatarSrc(user?.avatar)} alt="avatar" className="floating-chat-panel__avatar" />
                      </>
                    ) : (
                      <>
                        <img src={resolveSupportIcon()} alt="support" className="floating-chat-panel__avatar floating-chat-panel__avatar--left" />

                        {isOnlyLink && messagePreview ? (
                          <div className="floating-chat-panel__message-preview floating-chat-panel__message-preview--agent floating-chat-panel__message-preview--inline">
                            {renderPreviewCard(messagePreview)}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="floating-chat-panel__bubble"
                            onClick={() => setSelectedMessageId((prev) => (prev === message.id ? null : message.id))}
                          >
                            <span className="floating-chat-panel__message-text">{message.text}</span>
                            {selectedMessageId === message.id && (
                              <span className="floating-chat-panel__message-time">{formatMessageTime(message.createdAt)}</span>
                            )}
                          </button>
                        )}

                        <div className="floating-chat-panel__actions" aria-hidden>
                          <button
                            type="button"
                            className="floating-chat-panel__action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!window.confirm || !window.confirm("Bạn có chắc muốn xóa tin nhắn này?")) return;
                              setMessages((prev) => prev.filter((m) => String(m.id) !== String(message.id)));
                              try {
                                if (socketRef.current && socketRef.current.connected && room?.RoomID) {
                                  socketRef.current.emit("chat:delete", { roomId: room.RoomID, messageId: message.id });
                                }
                              } catch (e) {
                                console.warn("emit chat:delete failed", e);
                              }
                            }}
                            title="Xóa tin nhắn"
                          >
                            …
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mixed text + URL keeps preview as a separate line below */}
                  {!isOnlyLink && messagePreview && (
                    <div className={`floating-chat-panel__message-preview floating-chat-panel__message-preview--${message.role}`}>
                      {renderPreviewCard(messagePreview)}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {draftPreview && (
            <div className="floating-chat-panel__draft-preview">
              {renderPreviewCard(draftPreview)}
            </div>
          )}

          <div className="floating-chat-panel__composer">
            <textarea
              rows={2}
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                isAuthenticated
                  ? "Nhập nội dung..."
                  : "Vui lòng đăng nhập để chat"
              }
              disabled={!isAuthenticated || isConnecting}
              className="floating-chat-panel__input"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!isAuthenticated || isConnecting}
              className="floating-chat-panel__send"
            >
              Gửi
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Mở chat"
          title="Chat"
          className="floating-chat-button"
        >
          <img src={src} alt={alt} className="floating-chat-button__image" />
          <span className="floating-chat-button__badge" aria-hidden>
            {unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : ""}
          </span>
        </button>
      )}
    </>
  );
};

export default FloatingChatIcon;
