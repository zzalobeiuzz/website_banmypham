// components/Notification.js
import React from "react";
import successAnimation from "";
import "./components.scss";

const Notification = ({ message, type = "success", onClose }) => {
  if (type === "success") {
    return (
      <div className="notification-overlay">
        <div className="notification-success-box">
          <span className="icon">✅</span>
          <p className="message">{message}</p>
          <button className="close-btn" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
  }

  // Giữ nguyên hiển thị lỗi ở góc
  return (
    <div className={`notification-popup ${type}`}>
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
};

export default Notification;

