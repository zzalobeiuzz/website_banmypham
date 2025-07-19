// components/Notification.js
import React from "react";
import "./components.scss";

const Notification = ({ message, type = "success", onClose }) => {
  return (
    <div className={`.notification-popup ${type}`}>
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
};

export default Notification;
