import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import successAnimation from "./success.json"; // ← Đảm bảo đường dẫn đúng
import "./components.scss";

const Notification = ({ message, type = "success", onClose }) => {
  const animationRef = useRef(null);

  useEffect(() => {
    if (type === "success" && animationRef.current) {
      const anim = lottie.loadAnimation({
        container: animationRef.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        animationData: successAnimation
      });

      return () => anim.destroy();
    }
  }, [type]);

  if (type === "success") {
    return (
      <div className="notification-overlay">
        <div className="notification-success-box">
          <div className="lottie-animation" ref={animationRef} style={{ width: 120, height: 120 }} />
          <p className="message">{message}</p>
          <button className="close-btn" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`notification-popup ${type}`}>
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
};

export default Notification;
