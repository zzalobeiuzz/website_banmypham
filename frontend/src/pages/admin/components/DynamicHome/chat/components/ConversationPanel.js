import React from "react";
import MessageList from "./MessageList";

// Khung hội thoại bên phải: header phòng, danh sách tin nhắn, nút cuộn và ô soạn tin.

//Component chính vùng hội thoại bên phải, chứa header phòng chat, list message, nút scroll và composer nhập tin nhắn
// Panel hội thoại bên phải: header phòng, list message, nút scroll, composer
const ConversationPanel = ({
  selectedRoom,
  resolveRoomAvatar,
  resolveRoomTitle,
  messages,
  currentUserId,
  selectedMessageId,
  setSelectedMessageId,
  messagesContainerRef,
  handleMessagesScroll,
  messageEndRef,
  formatMessageTime,
  showScrollToBottom,
  scrollToBottom,
  draftMessage,
  setDraftMessage,
  sendMessage,
  onDeleteMessage,
}) => {
  return (
    <section className="admin-chat-page__conversation">
      {selectedRoom ? (
        <>
          {/* Header thông tin phòng chat */}
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

          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            selectedMessageId={selectedMessageId}
            onToggleMessage={(id) => setSelectedMessageId((prev) => (prev === id ? null : id))}
            messagesContainerRef={messagesContainerRef}
            onScroll={handleMessagesScroll}
            messageEndRef={messageEndRef}
            formatMessageTime={formatMessageTime}
            onDeleteMessage={onDeleteMessage}
          />

          {showScrollToBottom && (
            // Nút hiện khi người dùng đang ở xa cuối danh sách message
            <button
              type="button"
              onClick={scrollToBottom}
              className="admin-chat-page__scroll-to-bottom"
              aria-label="Scroll to bottom"
              title="Tới cuối"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 9l6 6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          <div className="admin-chat-page__composer">
            <textarea
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              onKeyDown={(e) => {
                // Enter để gửi nhanh, Shift+Enter để xuống dòng
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
  );
};

export default ConversationPanel;
