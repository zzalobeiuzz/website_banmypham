import React, { useCallback, useEffect, useState } from 'react';
import FloatingChatMessageItem from './FloatingChatMessageItem';

// Danh sách tin nhắn của chat nổi.
// Component này chỉ render dữ liệu; việc tải thêm, xóa tin nhắn và cache nằm ở file cha.
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
    currentUserAvatar,
    onDeleteMessage,
    formatMessageTime,
    onJumpVisibilityChange,
  } = props;
  const { invertRoles = false } = props;

  const resolveFirstUrl = (text) => {
    const match = String(text || '').match(/https?:\/\/[^\s<>"]+/i);
    return match ? match[0] : '';
  };

  const syncJumpButtonState = useCallback(() => {
    const container = messagesContainerRef?.current;
    if (!container) {
      onJumpVisibilityChange?.(false);
      return;
    }

    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 120;
    onJumpVisibilityChange?.(!nearBottom);
  }, [messagesContainerRef, onJumpVisibilityChange]);

  useEffect(() => {
    syncJumpButtonState();
  }, [messages, loadingOlder, syncJumpButtonState]);

  const handleScroll = (event) => {
    handleMessagesScroll?.(event);
    syncJumpButtonState();
  };

  const scrollToLatest = () => {
    const container = messagesContainerRef?.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    onJumpVisibilityChange?.(false);
  };

  return (
    <div className="floating-chat-panel__messages" ref={messagesContainerRef} onScroll={handleScroll}>
      <div ref={topSentinelRef} className="floating-chat-panel__top-sentinel" aria-hidden />
      {loadingOlder && (
        <div className="floating-chat-panel__loading-older">Đang tải...</div>
      )}

      {messages.map((message) => {
        const messagePreviewUrl = resolveFirstUrl(message.text);
        const messagePreview = messagePreviewUrl ? previewCache[messagePreviewUrl] : null;
        const isOnlyLink = messagePreviewUrl && message.text && message.text.trim() === messagePreviewUrl;
        return (
          <FloatingChatMessageItem
            key={message.id}
            message={message}
            invertRoles={invertRoles}
            isOnlyLink={isOnlyLink}
            messagePreview={messagePreview}
            renderPreviewCard={renderPreviewCard}
            selectedMessageId={selectedMessageId}
            setSelectedMessageId={setSelectedMessageId}
            resolveAvatarSrc={resolveAvatarSrc}
            resolveSupportIcon={resolveSupportIcon}
            currentUserAvatar={currentUserAvatar}
            onDeleteMessage={onDeleteMessage}
            formatMessageTime={formatMessageTime}
          />
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}
