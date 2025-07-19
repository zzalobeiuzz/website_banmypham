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

      anim.addEventListener("complete", () => {
        setAnimationCompleted(true);
      });

      return () => {
        anim.removeEventListener("complete", () => {});
        anim.destroy();
      };
    }
  }, [type]);

  return (
    <div className="notification">
      {type === "success" ? (
        <div className="notification__overlay">
          <div className="notification__success-box">
            <div
              className="notification__lottie-animation"
              ref={animationRef}
              style={{ width: 180, height: 180 }}
            />
            {animationCompleted && (
              <>
                <p className="notification__message">{message}</p>
                <button className="notification__close-btn" onClick={onClose}>
                  Đóng
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className={`notification__popup ${type}`}>
          <span>{message}</span>
          <button className="notification__popup-close" onClick={onClose}>×</button>
        </div>
      )}
    </div>
  );
};

export default Notification;
