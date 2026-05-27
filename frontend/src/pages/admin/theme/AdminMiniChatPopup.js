import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import ChatCache from "../components/DynamicHome/chat/cache";
import FloatingChatHeader from "../../user/component/floatingChatIcon/FloatingChatHeader";
import FloatingChatMessages from "../../user/component/floatingChatIcon/FloatingChatMessages";
import FloatingChatComposer from "../../user/component/floatingChatIcon/FloatingChatComposer";
import "./AdminMiniChatPopup.scss";

const resolveChatUserId = (value) => String(value || "").trim().toLowerCase();

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

const mergeUniqueMessages = (nextMessages) => {
  const seen = new Set();

  return nextMessages.filter((message) => {
    const key = String(message?.id || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};



const AdminMiniChatPopup = ({ room, onClose = () => {}, offsetIndex = 0 }) => {
  const [messages, setMessages] = useState([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [status, setStatus] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAnimatingCollapse, setIsAnimatingCollapse] = useState(false);
  const [isAnimatingExpand, setIsAnimatingExpand] = useState(false);
  const messagesContainerRef = useRef(null);
  const messageEndRef = useRef(null);
  const topSentinelRef = useRef(null);
  const minimizeTimerRef = useRef(null);
  const expandTimerRef = useRef(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const settingsRef = useRef(null);
  const [previewCache, setPreviewCache] = useState({});
  const loadingTimeoutRef = useRef(null);

  const currentUserId = useMemo(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      // prefer explicit email field if available, fall back to id/UserID
      return resolveChatUserId(storedUser?.email || storedUser?.id || storedUser?.UserID);
    } catch {
      return "";
    }
  }, []);

  // Normalize message inside component so we can access currentUserId
  const normalizeMessage = useCallback((message) => {
    const id = String(message?.MessageID || message?.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    const senderId = resolveChatUserId(message?.SenderID || message?.senderId || "");
    const text = String(message?.MessageText || message?.text || "");
    const rawCreatedAt = message?.CreatedAt ?? message?.createdAt ?? message?.created_at ?? message?.Created_At;
    const createdAt = rawCreatedAt ? new Date(rawCreatedAt) : new Date();

    const senderRole = Number(message?.senderRole || message?.SenderRole || 0);
    // treat explicit 'admin' senderId as admin, prefer explicit senderRole when available
    const isAdminSender = senderRole === 1 || senderId === "admin" || (senderId && currentUserId && senderId === currentUserId);

    return { id, senderId, text, createdAt, senderRole, isAdminSender };
  }, [currentUserId]);

  // Admin avatar should use support icon
  const currentUserAvatar = `${UPLOAD_BASE}/icons/icons8-support-100.png`;

  const resolveAvatarSrc = (value) => {
    const v = String(value || "").trim();
    if (!v) return `${UPLOAD_BASE}/icons/icons8-web-account.png`;
    if (/^https?:\/\//i.test(v) || v.startsWith("data:")) return v;
    const normalized = v.replace(/^\/+/, "").replace(/^uploads\/?assets\/?/i, "");
    return `${UPLOAD_BASE}/${normalized}`;
  };

  const roomId = Number(room?.RoomID || 0);
  const roomTitle = resolveRoomTitle(room);

  const syncMessages = useCallback((nextMessages, persistCache = true) => {
    const normalized = mergeUniqueMessages(
      nextMessages.map((m) => {
        const nm = normalizeMessage(m);
        return {
          ...nm,
          // Admin popup is visually reversed relative to the shared user chat component:
          // user/customer appears on the left, admin on the right.
          role: nm.isAdminSender ? "user" : "agent",
        };
      }),
    );
    setMessages(normalized);

    if (persistCache && roomId) {
      try {
        ChatCache.setRoomCache(roomId, {
          messages: normalized,
          hasMoreOlder: normalized.length > 0,
        });
      } catch (e) {
        // ignore cache errors
      }
    }
  }, [roomId, normalizeMessage]);

  const loadMessages = useCallback(async () => {
    if (!roomId) return;

    const cachedRoom = ChatCache.getRoomCache(roomId);
    if (cachedRoom?.messages) {
      syncMessages(cachedRoom.messages, false);
      setLoading(false);
      setStatus("");
      return;
    }

    setLoading(true);
    setStatus("Đang tải tin nhắn...");

    const socket = window.__adminSocket__ || null;
    const requestFromApi = async () => {
      const token = localStorage.getItem("accessToken") || "";
      const response = await fetch(`${API_BASE}/api/chat/rooms/${roomId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Không thể tải tin nhắn.");
      }
      return Array.isArray(data?.messages) ? data.messages : [];
    };

    try {
      if (socket && socket.connected) {
        socket.emit("chat:join", { roomId }, async (ack) => {
          try {
            if (ack?.success && Array.isArray(ack?.messages)) {
              syncMessages(ack.messages, true);
            } else {
              const fallbackMessages = await requestFromApi();
              syncMessages(fallbackMessages, true);
            }

            setStatus("");
            try {
              socket.emit("chat:seen", { roomId });
              window.dispatchEvent(new CustomEvent("admin-mini-seen", { detail: { roomId } }));
            } catch (e) {
              // ignore
            }
          } catch (error) {
            setStatus(error?.message || "Không thể tải tin nhắn.");
          } finally {
            setLoading(false);
          }
        });
        return;
      }

      const fallbackMessages = await requestFromApi();
      syncMessages(fallbackMessages, true);
      setStatus("");
      try {
        window.dispatchEvent(new CustomEvent("admin-mini-seen", { detail: { roomId } }));
      } catch (e) {
        // ignore
      }
    } catch (error) {
      setStatus(error?.message || "Không thể tải tin nhắn.");
    } finally {
      setLoading(false);
    }
  }, [roomId, syncMessages]);

  useEffect(() => {
    loadMessages();
    setSelectedMessageId(null);
    setDraftMessage("");
    setIsMinimized(false);
    setIsAnimatingCollapse(false);
    setIsAnimatingExpand(false);
  }, [loadMessages]);

  useEffect(() => {
    return () => {
      if (minimizeTimerRef.current) clearTimeout(minimizeTimerRef.current);
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const socket = window.__adminSocket__ || null;
    if (!socket || !roomId) return undefined;

    const handleChatMessage = (payload) => {
      const payloadRoomId = Number(payload?.RoomID || payload?.room?.RoomID || 0);
      if (payloadRoomId !== roomId) return;

      const nm = normalizeMessage(payload);
      const withRole = { ...nm, role: nm.isAdminSender ? "user" : "agent" };
      setMessages((prev) => mergeUniqueMessages([...prev, withRole]));
    };

    socket.on("chat:message", handleChatMessage);
    return () => socket.off("chat:message", handleChatMessage);
  }, [roomId, currentUserId, normalizeMessage]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    const nearBottom = container ? container.scrollHeight - container.scrollTop - container.clientHeight <= 120 : true;
    if (nearBottom && container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    const text = String(draftMessage || "").trim();
    const socket = window.__adminSocket__ || null;

    if (!text || !roomId || !socket) return;

    socket.emit(
      "chat:send",
      { roomId, messageText: text, messageType: "text" },
      (ack) => {
        if (!ack?.success) {
          setStatus(ack?.message || "Không thể gửi tin nhắn.");
        }
      },
    );

    setDraftMessage("");
  };

  const isAuthenticated = Boolean(localStorage.getItem('accessToken'));
  const isConnecting = !(window.__adminSocket__ && window.__adminSocket__.connected);

  const handleMessagesScroll = () => {
    try {
      const el = messagesContainerRef.current;
      if (!el) return;
      if (el.scrollTop <= 80) loadOlderMessages();
    } catch (e) {}
  };

  // load older messages via socket 'chat:join' with before/limit
  const loadOlderMessages = useCallback(() => {
    try {
      if (!roomId || !window.__adminSocket__ || loadingOlder || !hasMoreOlder) return;

      const earliest = messages?.[0]?.createdAt;
      const before = earliest ? new Date(earliest).toISOString() : null;
      const limit = 15;
      setLoadingOlder(true);
      try { if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current); } catch (e) {}
      loadingTimeoutRef.current = setTimeout(() => { try { setLoadingOlder(false); } catch (e) {} }, 5000);

      const prevScrollHeight = messagesContainerRef.current?.scrollHeight || 0;

      window.__adminSocket__.emit('chat:join', { roomId, before, limit }, (ack) => {
        try {
          if (ack?.success && Array.isArray(ack.messages) && ack.messages.length) {
            const older = mergeUniqueMessages(
              ack.messages.map((m) => {
                const nm = normalizeMessage(m);
                return {
                  ...nm,
                  role: nm.isAdminSender ? "user" : "agent",
                };
              }),
            );
            setMessages((prev) => mergeUniqueMessages([...older, ...prev]));
            try { ChatCache.setRoomCache(roomId, { messages: mergeUniqueMessages([...older, ...messages]), hasMoreOlder: ack.messages.length >= limit, }); } catch (e) {}

            requestAnimationFrame(() => {
              try { if (messagesContainerRef.current) { messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - prevScrollHeight; } } catch (e) {}
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
  }, [roomId, loadingOlder, hasMoreOlder, messages, normalizeMessage]);

  // observe top sentinel for more reliable load trigger
  useEffect(() => {
    try {
      const container = messagesContainerRef.current;
      const sentinel = topSentinelRef.current;
      if (!container || !sentinel) return undefined;

      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) loadOlderMessages(); });
      }, { root: container, threshold: 0.1 });

      io.observe(sentinel);
      return () => { try { io.disconnect(); } catch (e) {} };
    } catch (e) { return undefined; }
  }, [messagesContainerRef, topSentinelRef, hasMoreOlder, loadingOlder, roomId, loadOlderMessages]);

  // delete message handler (confirm, optimistic, emit)
  const handleDeleteMessage = useCallback(async (message) => {
    try {
      if (!message) return;
      if (!window.confirm || !window.confirm("Bạn có chắc muốn xóa tin nhắn này?")) return;
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(message.id)));
      try {
        if (window.__adminSocket__ && window.__adminSocket__.connected && roomId) {
          window.__adminSocket__.emit('chat:delete', { roomId, messageId: message.id });
        }
      } catch (e) { console.warn('Emit chat:delete failed', e); }
    } catch (e) { console.warn('delete message failed', e); }
  }, [roomId]);

  // fetch link preview for messages
  const fetchLinkPreview = useCallback(async (url) => {
    const previewUrl = (String(url || "").match(/https?:\/\/[^\s<>"]+/i) || [""])[0];
    if (!previewUrl) return null;

    if (previewCache[previewUrl]) return previewCache[previewUrl];

    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/api/chat/preview`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ url: previewUrl }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) return null;
    return data.data;
  }, [previewCache]);

  // populate previewCache for messages that contain URLs
  useEffect(() => {
    const urls = Array.from(new Set(messages.map((m) => { const match = String(m.text || '').match(/https?:\/\/[^\s<>"]+/i); return match ? match[0] : ''; }).filter(Boolean)));
    const pending = urls.filter((u) => !previewCache[u]);
    if (pending.length === 0) return undefined;
    let active = true;
    (async () => {
      for (const url of pending) {
        try {
          const preview = await fetchLinkPreview(url);
          if (!active || !preview) continue;
          setPreviewCache((prev) => (prev[url] ? prev : { ...prev, [url]: preview }));
        } catch (e) {
          // ignore
        }
      }
    })();
    return () => { active = false; };
  }, [messages, previewCache, fetchLinkPreview]);

  const renderPreviewCard = (preview) => {
    if (!preview) return null;
    return (
      <a className="admin-chat-page__preview-card" href={preview.url || '#'} target="_blank" rel="noopener noreferrer" aria-label={preview.title || preview.siteName || preview.url || 'Mở liên kết'}>
        {preview.image && (
          <div className="admin-chat-page__preview-thumb"><img src={preview.image} alt={preview.title || preview.siteName || 'preview'} /></div>
        )}
        <div className="admin-chat-page__preview-body">
          {preview.siteName && <div className="admin-chat-page__preview-site">{preview.siteName}</div>}
          {preview.title && <div className="admin-chat-page__preview-title">{preview.title}</div>}
          {preview.description && <div className="admin-chat-page__preview-description">{preview.description}</div>}
        </div>
      </a>
    );
  };

  useEffect(() => {
    try {
      if (isMinimized) {
        console.debug("[AdminMiniChatPopup] minimized", { roomId, roomTitle, offsetIndex });
      }
    } catch (e) {}
  }, [isMinimized, offsetIndex, roomId, roomTitle]);

  if (!room) return null;

  // compute position for either expanded panels (horizontal) or minimized avatars (vertical)
  const offsetClass = `admin-mini-chat-popup--offset-${offsetIndex}`;

  const handleMinimize = () => {
    if (isMinimized || isAnimatingCollapse) return;
    if (minimizeTimerRef.current) clearTimeout(minimizeTimerRef.current);
    setIsAnimatingCollapse(true);
    minimizeTimerRef.current = setTimeout(() => {
      setIsMinimized(true);
      setIsAnimatingCollapse(false);
    }, 180);
  };

  const handleRestore = () => {
    if (!isMinimized || isAnimatingExpand) return;
    if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
    setIsMinimized(false);
    setIsAnimatingExpand(true);
    expandTimerRef.current = setTimeout(() => {
      setIsAnimatingExpand(false);
    }, 180);
  };

  const popupClassName = [
    "admin-mini-chat-popup",
    "floating-chat-panel",
    offsetClass,
    isAnimatingCollapse ? "is-collapsing" : "",
    isAnimatingExpand ? "is-expanding" : "",
  ].filter(Boolean).join(" ");

  const popupContent = (
    isMinimized && !isAnimatingExpand ? (
      <button
        type="button"
        className={`admin-mini-chat-popup__collapsed floating-chat-panel__collapsed ${offsetClass}`}
        data-offset={offsetIndex}
        aria-label={`Mở lại chat ${roomTitle}`}
        title={roomTitle}
        onClick={handleRestore}
      >
        <img
          src={resolveRoomAvatar(room)}
          alt={roomTitle}
          className="admin-mini-chat-popup__collapsed-avatar"
        />
      </button>
    ) : (
      <div
        className={popupClassName}
        role="dialog"
        aria-label={`Mini chat ${roomTitle}`}
      >
        <FloatingChatHeader
          connectionStatus={status || (loading ? 'Đang kết nối...' : 'Đang mở hội thoại')}
          onToggleSettings={() => setShowSettings((s) => !s)}
          showSettings={showSettings}
          settingsRef={settingsRef}
          onToggleSoundMenu={() => setShowSoundMenu((s) => !s)}
          showSoundMenu={showSoundMenu}
          soundMuted={soundMuted}
          onSetSoundMuted={(v) => setSoundMuted(v)}
          onToggleMinimize={handleMinimize}
          onClose={onClose}
          title={roomTitle}
          avatarSrc={resolveRoomAvatar(room)}
        />

        <FloatingChatMessages
          messages={messages}
          messagesContainerRef={messagesContainerRef}
          topSentinelRef={topSentinelRef}
          loadingOlder={loadingOlder}
          handleMessagesScroll={handleMessagesScroll}
          messagesEndRef={messageEndRef}
          resolveAvatarSrc={resolveAvatarSrc}
          resolveSupportIcon={() => resolveRoomAvatar(room)}
          renderPreviewCard={renderPreviewCard}
          selectedMessageId={selectedMessageId}
          setSelectedMessageId={setSelectedMessageId}
          previewCache={previewCache}
          currentUserAvatar={currentUserAvatar || `${UPLOAD_BASE}/icons/icons8-web-account.png`}
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
              if (messageEndRef.current) {
                messageEndRef.current.scrollIntoView({ behavior: "smooth" });
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

        <FloatingChatComposer
          draftMessage={draftMessage}
          setDraftMessage={setDraftMessage}
          sendMessage={sendMessage}
          isAuthenticated={isAuthenticated}
          isConnecting={isConnecting}
        />
      </div>
      )
  );

    if (typeof document === "undefined") return popupContent;

    return createPortal(popupContent, document.body);
};

export default AdminMiniChatPopup;