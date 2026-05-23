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
  const [room, setRoom] = useState(null);// Room chat hiện tại
  const [connectionStatus, setConnectionStatus] = useState("offline"); // Trạng thái kết nối
  const [isConnecting, setIsConnecting] = useState(false);// Đang kết nối socket
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

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
    const isSameDay = date.toDateString() === now.toDateString();

    if (isSameDay) {
      return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    }

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

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
      // Chuẩn hóa tin nhắn cũ (nếu có)
      const nextMessages = Array.isArray(payload?.messages)
        ? payload.messages.map(normalizeMessage)
        : [];
      // Cập nhật room và tin nhắn vào state
      setRoom(nextRoom);
      setSelectedMessageId(null);
      
      // 2. Kiểm tra có tin nhắn cũ không
      if (nextMessages.length > 0) {
        // Nếu có thì hiển thị
        setMessages(nextMessages);
      } else {
        // Nếu server chưa trả tin nhắn thì seed một tin nhắn chào mừng thuộc về admin/agent
        setMessages([
          {
            id: `welcome_admin_${Date.now()}`,
            role: "agent",
            text: "Xin chào, mình có thể hỗ trợ gì cho bạn?",
            createdAt: new Date(),
          },
        ]);
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
      }

      setSelectedMessageId(null);

      // Cập nhật tin nhắn cũ nếu có
      if (Array.isArray(payload?.messages) && payload.messages.length > 0) {
        setMessages(payload.messages.map(normalizeMessage));
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
        }

        return [...prev, nextMessage];
      });
    });

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
  }, [isOpen, isAuthenticated, currentUserId, normalizeMessage, room?.RoomID]);

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

    try {
      socketRef.current.emit("chat:seen", { roomId: room.RoomID });
    } catch (e) {
      // ignore
    }
  }, [isOpen, room?.RoomID]);

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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
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

    // Toggle open
    setIsOpen((prev) => !prev);
  };

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
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng chat"
              className="floating-chat-panel__close"
            >
              ×
            </button>
          </div>

          <div className="floating-chat-panel__messages">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`floating-chat-panel__message-row floating-chat-panel__message-row--${message.role}`}
                >
                  {!isUser && (
                    <img
                      src={resolveSupportIcon()}
                      alt="support"
                      className="floating-chat-panel__avatar floating-chat-panel__avatar--left"
                    />
                  )}

                  <button
                    type="button"
                    className="floating-chat-panel__bubble"
                    onClick={() =>
                      setSelectedMessageId((prev) => (prev === message.id ? null : message.id))
                    }
                  >
                    <span className="floating-chat-panel__message-text">{message.text}</span>
                    {selectedMessageId === message.id && (
                      <span className="floating-chat-panel__message-time">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    )}
                  </button>

                  {isUser && (
                    <img
                      src={resolveAvatarSrc(user?.avatar)}
                      alt="avatar"
                      className="floating-chat-panel__avatar"
                    />
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

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
