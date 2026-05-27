import React from 'react';
import { UPLOAD_BASE } from "../../../../constants";

// Header của khung chat nổi.
// Component này chỉ lo giao diện, còn logic mở settings/tắt mở âm thanh nằm ở file cha.
export default function FloatingChatHeader(props) {
  const {
    connectionStatus,
    onToggleSettings,
    showSettings,
    settingsRef,
    onToggleSoundMenu,
    showSoundMenu,
    soundMuted,
    onSetSoundMuted,
    onToggleMinimize,
    onClose,
    title,
    avatarSrc,
  } = props;

  const SettingsIcon = () => (
    <img
      src={`${UPLOAD_BASE}/icons/icons8-setting-96.png`}
      alt=""
      aria-hidden="true"
      className="chat-settings-icon"
      width="20"
      height="20"
    />
  );

  return (
    <div className="floating-chat-panel__header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {avatarSrc && (
          <img src={avatarSrc} alt="avatar" className="floating-chat-panel__header-avatar" width="36" height="36" />
        )}
        <div>
          <div className="floating-chat-panel__title">{title || 'Hỗ trợ trực tuyến'}</div>
          <div className="floating-chat-panel__status">{connectionStatus || 'Phản hồi nhanh cho bạn'}</div>
        </div>
      </div>

      <div className="floating-chat-panel__header-actions">
        {typeof onToggleMinimize === 'function' && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }}
            aria-label="Thu nhỏ chat"
            className="floating-chat-panel__minimize"
            title="Thu nhỏ"
          >
            –
          </button>
        )}

        <div className="floating-chat-panel__header-settings" ref={settingsRef}>
          <button
            type="button"
            className="floating-chat-panel__settings-btn"
            onClick={(e) => { e.stopPropagation(); onToggleSettings(); }}
            title="Cài đặt chat"
            aria-label="Cài đặt chat"
          >
            <SettingsIcon />
          </button>

          {showSettings && (
            <div className="floating-chat-panel__settings">
              <div className="floating-chat-panel__settings-row">
                <span className="floating-chat-panel__settings-label">Thông báo</span>
                <div className="floating-chat-panel__settings-dropdown">
                  <button
                    type="button"
                    className="floating-chat-panel__settings-trigger"
                    onClick={(e) => { e.stopPropagation(); onToggleSoundMenu(); }}
                    aria-haspopup="menu"
                    aria-expanded={showSoundMenu}
                  >
                    <span>{soundMuted ? 'Tắt' : 'Bật'}</span>
                    <span className="floating-chat-panel__settings-caret" aria-hidden="true">▾</span>
                  </button>

                  {showSoundMenu && (
                    <div className="floating-chat-panel__settings-menu" role="menu">
                      <button
                        type="button"
                        className={`floating-chat-panel__settings-option${soundMuted ? '' : ' is-active'}`}
                        onClick={() => onSetSoundMuted(false)}
                      >
                        Bật
                      </button>
                      <button
                        type="button"
                        className={`floating-chat-panel__settings-option${soundMuted ? ' is-active' : ''}`}
                        onClick={() => onSetSoundMuted(true)}
                      >
                        Tắt
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chat"
          className="floating-chat-panel__close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
