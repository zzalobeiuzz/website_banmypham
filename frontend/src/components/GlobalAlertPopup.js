import React, { useEffect, useMemo, useState } from "react";

const ALERT_EVENT_NAME = "app:alert";

const GlobalAlertPopup = () => {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const handleAlertEvent = (event) => {
      const detail = event && event.detail ? event.detail : {};
      const message = String(detail.message || "").trim();
      if (!message) return;

      setQueue((prev) => [...prev, message]);
    };

    window.addEventListener(ALERT_EVENT_NAME, handleAlertEvent);
    return () => {
      window.removeEventListener(ALERT_EVENT_NAME, handleAlertEvent);
    };
  }, []);

  const currentMessage = useMemo(() => {
    if (!queue.length) return "";
    return queue[0];
  }, [queue]);

  const closeCurrent = () => {
    setQueue((prev) => prev.slice(1));
  };

  if (!currentMessage) return null;

  return (
    <div className="global-alert-overlay" role="alertdialog" aria-modal="true" aria-label="Thông báo hệ thống">
      <div className="global-alert-card">
        <div className="global-alert-title">Thông báo</div>
        <div className="global-alert-message">{currentMessage}</div>
        <button type="button" className="global-alert-button" onClick={closeCurrent}>
          Đóng
        </button>
      </div>
    </div>
  );
};

export const installGlobalAlertPopup = () => {
  if (window.__customAlertInstalled) return;

  const nativeAlert = window.alert;
  window.__nativeAlert = nativeAlert;

  window.alert = (message) => {
    const text = String(message === undefined || message === null ? "" : message);
    window.dispatchEvent(
      new CustomEvent(ALERT_EVENT_NAME, {
        detail: { message: text },
      })
    );
  };

  window.__customAlertInstalled = true;
};

export default GlobalAlertPopup;
