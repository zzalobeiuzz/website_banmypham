import React from 'react';

// Component hiển thị danh sách message, bao gồm sentinel ở trên để detect scroll-up
// Đây là component presentational; các hành vi (scroll, click) được truyền vào từ parent
export default function FloatingChatMessages(props) {
  const {
    messages,
    messagesContainerRef,
    topSentinelRef,
    loadingOlder,
    handleMessagesScroll,
    messagesEndRef,
    resolveAvatarSrc,
    resolveSupportIcon,
    renderPreviewCard,
    selectedMessageId,
    setSelectedMessageId,
    previewCache,
  } = props;

  return (
    <div className="floating-chat-panel__messages" ref={messagesContainerRef} onScroll={handleMessagesScroll}>
      <div ref={topSentinelRef} className="floating-chat-panel__top-sentinel" aria-hidden />
      {loadingOlder && (
        <div className="floating-chat-panel__loading-older">Đang tải...</div>
      )}

      {messages.map((message) => {
        const isUser = message.role === 'user';
        const messagePreviewUrl = (message.text && message.text.match(/https?:\/\/[^\s<>\"]+/i) || [])[0];
        const messagePreview = messagePreviewUrl ? previewCache[messagePreviewUrl] : null;
        const isOnlyLink = messagePreviewUrl && message.text && message.text.trim() === messagePreviewUrl;

        return (
          <React.Fragment key={message.id}>
            <div className={`floating-chat-panel__message-row floating-chat-panel__message-row--${message.role}`} style={{ position: 'relative' }}>
              {isUser ? (
                <>
                  <div className="floating-chat-panel__actions" aria-hidden>
                    <button
                      type="button"
                      className="floating-chat-panel__action-btn"
                      title="Xóa tin nhắn"
                      onClick={() => { /* parent handles deletion via prop if needed */ }}
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
                        <span className="floating-chat-panel__message-time">{new Date(message.createdAt).toLocaleString()}</span>
                      )}
                    </button>
                  )}

                  <img src={resolveAvatarSrc(/* user avatar not available here */ '')} alt="avatar" className="floating-chat-panel__avatar" />
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
                        <span className="floating-chat-panel__message-time">{new Date(message.createdAt).toLocaleString()}</span>
                      )}
                    </button>
                  )}

                  <div className="floating-chat-panel__actions" aria-hidden>
                    <button type="button" className="floating-chat-panel__action-btn" title="Xóa tin nhắn">…</button>
                  </div>
                </>
              )}
            </div>

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
  );
}
