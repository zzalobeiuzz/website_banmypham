import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./admin-chat.scss";

const SOCKET_URL = String(process.env.REACT_APP_SOCKET_URL || API_BASE || window.location.origin).replace(/\/$/, "");

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
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(date);
  }

  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
};

const AdminChatPage = () => {
  const { request } = useHttp();
  const socketRef = useRef(null);
  const messageEndRef = useRef(null);
  const selectedRoomIdRef = useRef(0);
  const fetchRoomsRef = useRef(null);

  const currentUserId = useMemo(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      return resolveChatUserId(storedUser?.id || storedUser?.UserID);
    } catch {
      return "";
    }
  }, []);

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Đang kết nối...");
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const currentRoomId = useMemo(() => Number(selectedRoom?.RoomID || 0), [selectedRoom]);

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

  const fetchRooms = React.useCallback(async () => {
    try {
      setLoadingRooms(true);
      const response = await request("GET", `${API_BASE}/api/chat/admin/rooms`);
      const roomData = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
      const activeRoomId = Number(selectedRoomIdRef.current || 0);

      const normalizedRooms = roomData.map((room) =>
        Number(room.RoomID) === activeRoomId ? { ...room, UnreadCount: 0 } : room,
      );

      setRooms(normalizedRooms);
      const counts = {};
      normalizedRooms.forEach((room) => {
        counts[String(room.RoomID)] = Number(room.UnreadCount || 0);
      });
      setUnreadCounts(counts);

      const totalUnread = normalizedRooms.reduce((sum, room) => sum + Number(room?.UnreadCount || 0), 0);
      try {
        window.dispatchEvent(
          new CustomEvent("admin-rooms-sync", {
            detail: {
              rooms: normalizedRooms,
              totalUnread,
            },
          }),
        );
      } catch (e) {
        // ignore
      }
    } catch (error) {
      setConnectionStatus(error?.message || "Không thể tải danh sách phòng chat.");
    } finally {
      setLoadingRooms(false);
    }
  }, [request]);

  useEffect(() => {
    fetchRoomsRef.current = fetchRooms;
  }, [fetchRooms]);

  useEffect(() => {
    fetchRoomsRef.current?.();
  }, []);

  useEffect(() => {
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

    const normalizeMessage = (message) => {
      const id = String(message?.MessageID || message?.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      const roomId = Number(message?.RoomID || message?.room?.RoomID || 0);
      const senderId = resolveChatUserId(message?.SenderID || "");
      const text = String(message?.MessageText || message?.text || "");
      const rawCreatedAt = message?.CreatedAt;
      const createdAt = rawCreatedAt ? new Date(rawCreatedAt) : new Date();

      try {
        console.debug("[AdminChat] normalizeMessage", {
          rawCreatedAt,
          parsed: createdAt.toString(),
          tzOffsetMin: createdAt.getTimezoneOffset(),
        });
      } catch (e) {
        // ignore
      }

      return { id, roomId, senderId, text, createdAt };
    };

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
                socket.auth = { token: data.accessToken };
              } catch (e) {}
              socket.connect();
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
        setMessages(payload.messages.map(normalizeMessage));
      }
    };

    const mergeRoomFromMessage = (roomId, payload, isSelectedRoom) => {
      const senderRole = Number(payload?.senderRole || payload?.SenderRole || 0);
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

      if (!isSelectedRoom && senderRole !== 1) {
        setUnreadCounts((prev) => {
          const key = String(roomId || "0");
          const prevCount = Number(prev[key] || 0);
          return { ...prev, [key]: prevCount + 1 };
        });
      }
    };

    const handleChatMessage = (payload) => {
      const roomId = Number(payload?.RoomID || payload?.room?.RoomID || 0);
      const senderRole = Number(payload?.senderRole || payload?.SenderRole || 0);

      mergeRoomFromMessage(roomId, payload, roomId === Number(selectedRoomIdRef.current || 0));

      if (roomId === Number(selectedRoomIdRef.current || 0)) {
        setMessages((prev) => [...prev, normalizeMessage(payload)]);
      }

      if (senderRole === 1) {
        return;
      }

      // Re-sync with server so the room list always reflects the latest message preview/order.
      fetchRoomsRef.current?.();
    };

    const handleRoomUpdated = (payload) => {
      const updatedRoom = payload?.room;
      if (!updatedRoom?.RoomID) return;

      setRooms((prev) => {
        const exists = prev.some((room) => Number(room.RoomID) === Number(updatedRoom.RoomID));
        if (!exists) {
          return [updatedRoom, ...prev];
        }

        return prev.map((room) =>
          Number(room.RoomID) === Number(updatedRoom.RoomID) ? { ...room, ...updatedRoom } : room,
        );
      });

      fetchRoomsRef.current?.();
    };

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
  }, []);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
    setMessages([]);
    setSelectedMessageId(null);
    setUnreadCounts(nextUnreadCounts);
    setRooms(nextRooms);
    window.__adminSelectedRoomId = nextRoomId;

    const totalUnread = Object.values(nextUnreadCounts).reduce((sum, value) => sum + Number(value || 0), 0);
    try {
      if (typeof window.__setAdminUnreadCount === "function") {
        window.__setAdminUnreadCount(totalUnread);
      } else {
        window.dispatchEvent(
          new CustomEvent("admin-unread-sync", {
            detail: totalUnread,
          }),
        );
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

    try {
      const socket = socketRef.current;
      if (!socket) return;

      socket.emit("chat:join", { roomId: room.RoomID }, (ack) => {
        if (ack?.success && Array.isArray(ack?.messages)) {
          const normalized = ack.messages.map((message) => ({
            id: String(message?.MessageID || message?.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
            roomId: Number(message?.RoomID || room.RoomID),
            senderId: resolveChatUserId(message?.SenderID || ""),
            text: String(message?.MessageText || message?.text || ""),
            createdAt: message?.CreatedAt ? new Date(message.CreatedAt) : new Date(),
          }));
          setMessages(normalized);
        }
      });

      fetchRooms();
    } catch (error) {
      setConnectionStatus(error?.message || "Không thể tải tin nhắn.");
    }
  };

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

  return (
    <div className="admin-chat-page">
      <div className="admin-chat-page__header">
        <div>
          <h2>Chat với khách hàng</h2>
          <p>{connectionStatus}</p>
        </div>
      </div>

      <div className="admin-chat-page__body">
        <aside className="admin-chat-page__rooms">
          <div className="admin-chat-page__rooms-title">Danh sách phòng</div>
          {loadingRooms ? (
            <div className="admin-chat-page__empty">Đang tải...</div>
          ) : rooms.length === 0 ? (
            <div className="admin-chat-page__empty">Chưa có phòng chat nào.</div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.RoomID}
                type="button"
                className={`admin-chat-page__room ${Number(selectedRoom?.RoomID) === Number(room.RoomID) ? "active" : ""}`}
                onClick={() => selectRoom(room)}
              >
                <div className="admin-chat-page__room-avatar-wrapper">
                  <img src={resolveRoomAvatar(room)} alt={resolveRoomTitle(room)} className="admin-chat-page__room-avatar" />
                  {Number(unreadCounts[String(room.RoomID)] || 0) > 0 && (
                    <span className="admin-chat-page__room-badge">{unreadCounts[String(room.RoomID)]}</span>
                  )}
                </div>
                <div className="admin-chat-page__room-content">
                  <strong>{resolveRoomTitle(room)}</strong>
                  <span>{room.LastMessageText || "Chưa có tin nhắn"}</span>
                </div>
              </button>
            ))
          )}
        </aside>

        <section className="admin-chat-page__conversation">
          {selectedRoom ? (
            <>
              <div className="admin-chat-page__conversation-header">
                <div className="admin-chat-page__conversation-header-title">
                  <img
                    src={resolveRoomAvatar(selectedRoom)}
                    alt={resolveRoomTitle(selectedRoom)}
                    className="admin-chat-page__conversation-avatar"
                  />
                  <strong>{resolveRoomTitle(selectedRoom)}</strong>
                </div>
                <span>{selectedRoom.RoomType || "private"}</span>
              </div>

              <div className="admin-chat-page__messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`admin-chat-page__message ${message.senderId === currentUserId ? "admin" : "user"}`}
                  >
                    <button
                      type="button"
                      className="admin-chat-page__message-bubble"
                      onClick={() => setSelectedMessageId((prev) => (prev === message.id ? null : message.id))}
                    >
                      <span className="admin-chat-page__message-text">{message.text}</span>
                      {selectedMessageId === message.id && (
                        <span className="admin-chat-page__message-time">{formatMessageTime(message.createdAt)}</span>
                      )}
                    </button>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>

              <div className="admin-chat-page__composer">
                <textarea
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Nhập phản hồi..."
                  rows={2}
                />
                <button type="button" onClick={sendMessage}>
                  Gửi
                </button>
              </div>
            </>
          ) : (
            <div className="admin-chat-page__empty admin-chat-page__empty--center">Chọn một phòng để xem tin nhắn.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminChatPage;