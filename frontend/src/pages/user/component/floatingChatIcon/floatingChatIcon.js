import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE, UPLOAD_BASE } from "../../../../constants";
import { useAuth } from "../../context/AuthContext";
import ChatCache from "./cache";
import FloatingChatHeader from "./FloatingChatHeader";
import FloatingChatMessages from "./FloatingChatMessages";
import FloatingChatComposer from "./FloatingChatComposer";
import "./floatingChatIcon.scss";


// Khung chat nổi của người dùng: mở phòng, tải tin nhắn, gửi tin và tự cuộn về tin mới nhất.


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
  const pendingScrollToLatestRef = useRef(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const topSentinelRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const [room, setRoom] = useState(null);// Room chat hiện tại
  const [connectionStatus, setConnectionStatus] = useState("offline"); // Trạng thái kết nối
  const [isConnecting, setIsConnecting] = useState(false);// Đang kết nối socket
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
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
      const base = (UPLOAD_BASE || "").replace(/\/$/, "");
      audioRef.current = new Audio(`${base}/sounds/notification.mp3`);
      audioRef.current.preload = 'auto';
      // try to prime playback by playing muted then pausing
      try {
        audioRef.current.muted = true;
        const p = audioRef.current.play();
        if (p && typeof p.then === 'function') {
          p.then(() => { try { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current.muted = soundMuted; } catch (e) {} }).catch(() => { try { audioRef.current.muted = soundMuted; } catch (e) {} });
        } else {
          try { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current.muted = soundMuted; } catch (e) { audioRef.current.muted = soundMuted; }
        }
      } catch (e) { try { audioRef.current.muted = soundMuted; } catch (e) {} }
    } catch (e) {
      // ignore
    }
  }, [soundMuted]);

  const tryPlayNotification = useCallback(() => {
    if (soundMuted) return;
    if (!audioRef.current) initNotificationAudio();
    const a = audioRef.current;
    if (!a) return;
    try {
      console.debug('[floatingChat] trying play', a.src);
      // ensure latest file fetched
      try { a.src = (UPLOAD_BASE || "").replace(/\/$/, "") + '/sounds/notification.mp3?_=' + Date.now(); } catch (e) {}
      try { a.muted = false; a.currentTime = 0; } catch (e) {}
      const p = a.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // oscillator fallback
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.04;
            o.connect(g); g.connect(ctx.destination); o.start();
            setTimeout(() => { try { o.stop(); o.disconnect(); g.disconnect(); } catch (e) {} }, 180);
          } catch (e) {}
        });
      }
    } catch (e) {}
  }, [initNotificationAudio, soundMuted]);

  useEffect(() => {
    return () => {
      try {
        if (audioRef.current && audioRef.current._resumeHandler) window.removeEventListener('click', audioRef.current._resumeHandler);
      } catch (e) {}
    };
  }, []);

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
      if (!mounted) return;
      setConnectionStatus("Đã kết nối");
    });

    // Handlers lifecycle: log và cập nhật trạng thái khi socket tự reconnect
    socket.on("reconnect", () => {
      setConnectionStatus("Đã kết nối (tự phục hồi)");
    });

    socket.on("reconnect_attempt", () => {
      setConnectionStatus("Đang thử kết nối lại...");
    });

    socket.on("reconnect_error", () => {
      setConnectionStatus("Lỗi khi thử kết nối lại");
    });

    socket.on("reconnect_failed", () => {
      setConnectionStatus("Không thể kết nối lại");
    });

    // Khi connect_error xảy ra, kiểm tra nếu lỗi liên quan token thì tự động
    // gọi API refresh-token để lấy accessToken mới và thử kết nối lại.
    // Nếu không thể refresh thì yêu cầu user đăng nhập lại.
    socket.on("connect_error", (err) => {
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
          } catch (e) {}

          // Nếu refresh không thành công, yêu cầu user đăng nhập lại
          setConnectionStatus("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
          try { window.dispatchEvent(new Event("open-login")); } catch (e) {}
        })();
        return;
      }

      setConnectionStatus(err?.message || "Lỗi kết nối");
    });

    socket.on("connect_timeout", () => {
      setConnectionStatus("Kết nối timeout");
    });

    // === MẤT KẾT NỐI ===
    socket.on("disconnect", () => {
      if (!mounted) return;
      setConnectionStatus("Mất kết nối");
    });

    // === SẲN SÀNG CHAT ===
    socket.on("chat:ready", (payload) => {
      if (!mounted) return;
      // * 1. Nhận thông tin được trả về 

      const nextRoom = payload?.room || null;
      // Chuẩn hóa tin nhắn cũ (nếu có) and keep only last page to avoid loading whole history
      const limit = 15;
      const nextMessages = Array.isArray(payload?.messages)
        ? payload.messages.map(normalizeMessage)
        : [];
      const cachedRoom = nextRoom?.RoomID ? ChatCache.getRoomCache(nextRoom.RoomID) : null;
      const cachedMessages = Array.isArray(cachedRoom?.messages) ? cachedRoom.messages : [];
      const resolvedMessages = cachedMessages.length > 0 ? cachedMessages : nextMessages;

      // Cập nhật room và tin nhắn vào state
      setRoom(nextRoom);
      setSelectedMessageId(null);
      if (isOpen && nextRoom?.RoomID) {
        markCurrentRoomAsSeen(nextRoom.RoomID);
      }

      if (resolvedMessages.length > 0) {
        if (resolvedMessages.length > limit) {
          setMessages(resolvedMessages.slice(-limit));
          setHasMoreOlder(true);
        } else {
          setMessages(resolvedMessages);
          setHasMoreOlder(resolvedMessages.length >= limit);
        }
        // if panel is open, ensure we scroll to latest after loading messages
        if (isOpen) pendingScrollToLatestRef.current = true;
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
        const currentRoomId = payload?.room?.RoomID || room?.RoomID || null;
        const cachedRoom = currentRoomId ? ChatCache.getRoomCache(currentRoomId) : null;
        const cachedMessages = Array.isArray(cachedRoom?.messages) ? cachedRoom.messages : [];
        const normalized = Array.isArray(payload?.messages) && payload.messages.length > 0
          ? payload.messages.map(normalizeMessage)
          : [];
        const resolvedMessages = cachedMessages.length > 0 ? cachedMessages : normalized;

        if (resolvedMessages.length > 0) {
          if (resolvedMessages.length > limit) {
            const last = resolvedMessages.slice(-limit);
            setMessages(last);
            setHasMoreOlder(true);
          } else {
            setMessages(resolvedMessages);
            setHasMoreOlder(resolvedMessages.length >= limit);
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
          setUnreadCount((c) => c + 1);

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
        // Cập nhật token (nếu thay đổi) trước khi connect, để server nhận auth mới khi reconnect
        try { socketRef.current.auth = { token: localStorage.getItem("accessToken") }; } catch (e) {}
        socketRef.current.connect();
      } catch (e) {
        // ignore connect error in UI layer
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

  // Whenever the room panel opens, force the view to the latest message after render.
  useEffect(() => {
    if (!isOpen) return undefined;

    pendingScrollToLatestRef.current = true;

    const rafId = requestAnimationFrame(() => {
      try {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
        }
      } catch (e) {}
      pendingScrollToLatestRef.current = false;
    });

    return () => cancelAnimationFrame(rafId);
  }, [isOpen, room?.RoomID]);

  useEffect(() => {
    if (!isOpen || !room?.RoomID || !socketRef.current) return;

    markCurrentRoomAsSeen(room.RoomID);
  }, [isOpen, room?.RoomID, markCurrentRoomAsSeen]);

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

      const container = messagesContainerRef.current;

      // If we explicitly requested a scroll-to-latest (e.g., when opening), do it regardless
      if (pendingScrollToLatestRef.current && container && isOpen) {
        try { container.scrollTop = container.scrollHeight; } catch (e) {}
        pendingScrollToLatestRef.current = false;
        return;
      }

      // Only auto-scroll when user is already at (or near) the bottom.
      const nearBottom = container
        ? container.scrollHeight - container.scrollTop - container.clientHeight <= 120
        : true;

      if (nearBottom && messagesEndRef.current && isOpen) {
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
                  // ensure we scroll to latest when opening
                  pendingScrollToLatestRef.current = true;
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

  // Xử lý xóa tin nhắn ở tầng cha để component con chỉ cần gọi callback
  const handleDeleteMessage = useCallback((message) => {
    try {
      if (!message?.id) return;
      if (!window.confirm || !window.confirm("Bạn có chắc muốn xóa tin nhắn này?")) return;

      setMessages((prev) => prev.filter((item) => String(item.id) !== String(message.id)));

      try {
        if (socketRef.current && socketRef.current.connected && room?.RoomID) {
          socketRef.current.emit("chat:delete", { roomId: room.RoomID, messageId: message.id });
        }
      } catch (e) {
        // bỏ qua lỗi emit xóa
      }
    } catch (e) {
      // bỏ qua lỗi UI xóa tin nhắn
    }
  }, [room?.RoomID]);

  // Lưu dữ liệu đang có vào RAM theo từng room để khi mở lại vẫn dùng lại ngay
  useEffect(() => {
    if (!room?.RoomID) return;
    try {
      ChatCache.setRoomCache(room.RoomID, {
        messages,
        hasMoreOlder,
      });
    } catch (e) {
      // bỏ qua lỗi cache RAM
    }
  }, [room?.RoomID, messages, hasMoreOlder]);

  const loadOlderMessages = useCallback(() => {
    try {
      if (!room?.RoomID || !socketRef.current || loadingOlder || !hasMoreOlder) {
        return;
      }
      const earliest = messages?.[0]?.createdAt;
      const before = earliest ? new Date(earliest).toISOString() : null;
      const limit = 15;
      setLoadingOlder(true);
      try { if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current); } catch (e) {}
      loadingTimeoutRef.current = setTimeout(() => {
        try { setLoadingOlder(false); } catch (e) {}
      }, 5000);
      const prevScrollHeight = messagesContainerRef.current?.scrollHeight || 0;

      socketRef.current.emit('chat:join', { roomId: room.RoomID, before, limit }, (ack) => {
        try {
          if (ack?.success && Array.isArray(ack.messages) && ack.messages.length) {
            const older = mergeUniqueMessages(ack.messages.map(normalizeMessage));
            skipAutoScrollRef.current = true;
            setMessages((prev) => mergeUniqueMessages([...older, ...prev]));
            try {
              ChatCache.setRoomCache(room.RoomID, {
                messages: mergeUniqueMessages([...older, ...messages]),
                hasMoreOlder: ack.messages.length >= limit,
              });
            } catch (e) {}
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
          <FloatingChatHeader
            connectionStatus={connectionStatus}
            onToggleSettings={() => {
              setShowSettings((value) => !value);
              setShowSoundMenu(false);
            }}
            showSettings={showSettings}
            settingsRef={settingsRef}
            onToggleSoundMenu={() => setShowSoundMenu((value) => !value)}
            showSoundMenu={showSoundMenu}
            soundMuted={soundMuted}
            onSetSoundMuted={(nextMuted) => {
              setSoundMuted(nextMuted);
              setShowSoundMenu(false);
              try { localStorage.setItem('chatSoundMuted', nextMuted ? 'true' : 'false'); } catch (e) {}
              try { if (audioRef.current) audioRef.current.muted = nextMuted; } catch (e) {}
            }}
            onClose={() => setIsOpen(false)}
          />

          <FloatingChatMessages
            messages={messages}
            messagesContainerRef={messagesContainerRef}
            topSentinelRef={topSentinelRef}
            loadingOlder={loadingOlder}
            handleMessagesScroll={handleMessagesScroll}
            messagesEndRef={messagesEndRef}
            resolveAvatarSrc={resolveAvatarSrc}
            resolveSupportIcon={resolveSupportIcon}
            renderPreviewCard={renderPreviewCard}
            selectedMessageId={selectedMessageId}
            setSelectedMessageId={setSelectedMessageId}
            previewCache={previewCache}
            currentUserAvatar={user?.avatar}
            onDeleteMessage={handleDeleteMessage}
            formatMessageTime={formatMessageTime}
            onJumpVisibilityChange={setShowJumpToLatest}
          />

          {showJumpToLatest && (
            <button
              type="button"
              className="floating-chat-panel__jump-to-latest"
              onClick={() => {
                const container = messagesContainerRef.current;
                if (container) {
                  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
                }
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                }
                setShowJumpToLatest(false);
              }}
              aria-label="Cuộn tới tin nhắn mới nhất"
              title="Tới tin nhắn mới nhất"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 5v12M7 12l5 5 5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
          )}

          {draftPreview && (
            <div className="floating-chat-panel__draft-preview">
              {renderPreviewCard(draftPreview)}
            </div>
          )}

          <FloatingChatComposer
            draftMessage={draftMessage}
            setDraftMessage={setDraftMessage}
            sendMessage={sendMessage}
            isAuthenticated={isAuthenticated}
            isConnecting={isConnecting}
          />
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
