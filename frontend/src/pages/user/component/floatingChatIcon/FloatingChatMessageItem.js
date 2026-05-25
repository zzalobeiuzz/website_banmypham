import React from 'react';

// Một tin nhắn đơn lẻ trong chat nổi.
// Component này chỉ lo hiển thị từng message và nhận toàn bộ hành vi qua props.
export default function FloatingChatMessageItem(props) {
  const {
    message,
    isOnlyLink,
    messagePreview,
    renderPreviewCard,
    selectedMessageId,
    setSelectedMessageId,
    resolveAvatarSrc,
    resolveSupportIcon,
    currentUserAvatar,
    onDeleteMessage,
    formatMessageTime,
  } = props;

  const isUser = message.role === 'user';

  return (
    <React.Fragment>
      <div className={`floating-chat-panel__message-row floating-chat-panel__message-row--${message.role}`} style={{ position: 'relative' }}>
        {isUser ? (
          <>
            <div className="floating-chat-panel__actions" aria-hidden>
              <button
                type="button"
                className="floating-chat-panel__action-btn"
                title="Xóa tin nhắn"
                onClick={() => onDeleteMessage?.(message)}
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
                  <span className="floating-chat-panel__message-time">
                    {formatMessageTime?.(message.createdAt) || new Date(message.createdAt).toLocaleString()}
                  </span>
                )}
              </button>
            )}

            <img src={resolveAvatarSrc(currentUserAvatar)} alt="avatar" className="floating-chat-panel__avatar" />
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
                  <span className="floating-chat-panel__message-time">
                    {formatMessageTime?.(message.createdAt) || new Date(message.createdAt).toLocaleString()}
                  </span>
                )}
              </button>
            )}

            <div className="floating-chat-panel__actions" aria-hidden>
              <button
                type="button"
                className="floating-chat-panel__action-btn"
                title="Xóa tin nhắn"
                onClick={() => onDeleteMessage?.(message)}
              >
                …
              </button>
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
}
