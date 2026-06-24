import React from 'react';

// Khu vực soạn tin nhắn của chat nổi.
export default function FloatingChatComposer(props) {
  const {
    draftMessage,
    setDraftMessage,
    sendMessage,
    isAuthenticated,
    isConnecting,
  } = props;

  const placeholder = isAuthenticated
    ? (isConnecting ? 'Đang kết nối, bạn vẫn có thể nhập...' : 'Nhập nội dung...')
    : 'Đăng nhập để chat với nhân viên';

  return (
    <div className="floating-chat-panel__composer">
      <textarea
        rows={2}
        value={draftMessage}
        onChange={(e) => setDraftMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
        placeholder={placeholder}
        disabled={false}
        className="floating-chat-panel__input"
      />
      <button
        type="button"
        onClick={sendMessage}
        disabled={!isAuthenticated}
        className="floating-chat-panel__send"
      >
        Gửi
      </button>
    </div>
  );
}
