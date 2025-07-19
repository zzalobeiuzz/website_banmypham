import React from "react";
import "./"; // hoặc .css nếu bạn không dùng SCSS

const Notification = ({ message, type = "success", onClose }) => {
  return (
    <div className={`notification-container ${type}`}>
      <div className="notification-content">
        <span>{message}</span>
        <button onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default Notification;
