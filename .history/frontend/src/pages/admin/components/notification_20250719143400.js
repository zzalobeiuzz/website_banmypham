// components/Notification.js
import React from "react";
import "./components.scss";

const Notification = ({ message, type = "success", onClose }) => {
  return (
    <div className={`notification-popup ${type}`}>
      {type === "success" ? (
        <div className="success-content">
          <span role="img" aria-label="success">✅</span>
          <strong>{message}</strong>
        </div>
      ) : (
        <span>{message}</span>
      )}
      <button onClick={onClose}>×</button>
    </div>
  );
};


export default Notification;
