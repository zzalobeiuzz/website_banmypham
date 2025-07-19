import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import successAnimation from "./Success.json";
import "./components.scss";

const Notification = ({ message, type = "success", onClose }) => {
  const animationRef = useRef(null);
  const [animationCompleted, setAnimationCompleted] = useState(false);

  useEffect(() => {
    if (type === "success" && animationRef.current) {
      const anim = lottie.loadAnimation({
        container: animationRef.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        animationData: successAnimation,
      });

      // Khi animation chạy xong thì hiển thị message
      anim.addEventListener("complete", () => {
        setAnimationCompleted(true);
      });

      return () => {
        anim.removeEventListener("complete", () => {});
        anim.destroy();
      };
    }
  }, [type]);

  if (type === "success") {
    return (
      <div className="notification-overlay">
        <div className="notification-success-box">
          <div
            className="lottie-animation"
            ref={animationRef}
            style={{ width: 180, height: 180 }}
          />
          {animationCompleted && (
            <>
              <p className="message">{message}</p>
              <button className="close-btn" onClick={onClose}>
                Đóng
              </button>
            </>
          )}
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
