// COMPONENT: HIỂN THỊ DANH SÁCH TIN NHẮN TRONG PHÒNG CHAT ĐÃ CHỌN
import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../../../constants";

const extractFirstUrl = (value) => {
  const text = String(value || "");
  const match = text.match(/https?:\/\/[^\s<>"]+/i);
  if (!match) return "";
  return match[0].replace(/[),.;!?]+$/, "");
};

const renderPreviewCard = (preview) => {
  if (!preview) return null;

  return (
    <a
      className="admin-chat-page__preview-card"
      href={preview.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={preview.title || preview.siteName || preview.url || "Mở liên kết"}
    >
      {preview.image && (
        <div className="admin-chat-page__preview-thumb">
          <img src={preview.image} alt={preview.title || preview.siteName || "preview"} />
        </div>
      )}
      <div className="admin-chat-page__preview-body">
        {preview.siteName && <div className="admin-chat-page__preview-site">{preview.siteName}</div>}
        {preview.title && <div className="admin-chat-page__preview-title">{preview.title}</div>}
        {preview.description && <div className="admin-chat-page__preview-description">{preview.description}</div>}
      </div>
    </a>
  );
};

const MessageList = ({
  messages = [],
  currentUserId = "",
  selectedMessageId = null,
  onToggleMessage = () => {},
  messagesContainerRef = null,
  onScroll = () => {},
  messageEndRef = null,
  formatMessageTime = () => "",
  onDeleteMessage = null,
}) => {
  const [previewCache, setPreviewCache] = useState({});

  

  useEffect(() => {
    const urls = Array.from(new Set(messages.map((message) => extractFirstUrl(message.text)).filter(Boolean)));
    const pendingUrls = urls.filter((url) => !previewCache[url]);
    if (pendingUrls.length === 0) return undefined;

    let active = true;

    (async () => {
      for (const url of pendingUrls) {
        try {
          const previewUrl = extractFirstUrl(url);
          if (!previewUrl) continue;
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
          if (!response.ok || !data?.success) continue;

          const preview = data.data;
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
  }, [messages, previewCache]);

  return (
    <div ref={messagesContainerRef} onScroll={onScroll} className="admin-chat-page__messages">
      {messages.map((message, index) => {
        const key = String(message.id || `${index}_${message?.createdAt?.getTime?.() || 0}`);
        const previewUrl = extractFirstUrl(message.text);
        const preview = previewUrl ? previewCache[previewUrl] : null;
        const isOnlyLink = previewUrl && message.text && message.text.trim() === previewUrl;

        return (
          <div
            key={key}
            className={`admin-chat-page__message ${
              typeof message.isAdminSender === "boolean"
                ? message.isAdminSender
                  ? "admin"
                  : "user"
                : message.senderId === currentUserId
                ? "admin"
                : "user"
            }`}
          >
            {/* If message is just a URL and we have a preview, render only the preview card */}
            {preview && isOnlyLink ? (
              <div className="admin-chat-page__message-preview">{renderPreviewCard(preview)}</div>
            ) : (
              <>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="admin-chat-page__message-bubble"
                    onClick={() => onToggleMessage(message.id)}
                  >
                    <span className="admin-chat-page__message-text">{message.text}</span>
                    {selectedMessageId === message.id && (
                      <span className="admin-chat-page__message-time">{formatMessageTime(message.createdAt)}</span>
                    )}
                  </button>

                  <div className="admin-chat-page__message-actions" aria-hidden>
                    <button
                      type="button"
                      className="admin-chat-page__message-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof onDeleteMessage === "function") onDeleteMessage(message.id);
                        else console.warn("Delete handler not provided for message", message.id);
                      }}
                      title="Xóa tin nhắn"
                    >
                      …
                    </button>
                  </div>
                </div>

                {preview && (
                  <div className="admin-chat-page__message-preview">{renderPreviewCard(preview)}</div>
                )}
              </>
            )}
          </div>
        );
      })}
      <div ref={messageEndRef} />
    </div>
  );
};

export default MessageList;
