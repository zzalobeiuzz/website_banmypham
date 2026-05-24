import React from 'react';

// Composer (ô nhập + nút gửi) của floating chat
export default function FloatingChatComposer(props) {
  const { draftMessage, setDraftMessage, sendMessage, isAuthenticated, isConnecting } = props;

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
        placeholder={isAuthenticated ? 'Nhập nội dung...' : 'Vui lòng đăng nhập để chat'}
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
  );
}
