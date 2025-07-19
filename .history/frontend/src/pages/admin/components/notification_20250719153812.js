import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import successAnimation from "./Success.json";
import "./components.scss";

const Notification = ({ message, type = "success", onClose, onConfirm }) => {
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
            <div
              className={`notification__content ${
                animationCompleted ? "visible" : "hidden"
              }`}
            >
              <p className="notification__message">{message}</p>
              <p className="notification__question">
                Bạn có muốn thêm sản phẩm khác không?
              </p>
              <div className="notification__actions">
                <button
                  className="notification__close-btn notification__close-btn--secondary"
                  onClick={onConfirm}
                >
                  Không
                </button>
                <button
                  className="notification__close-btn"
                  onClick={() => window.location.reload()}
                >
                  Có
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`notification__popup ${type}`}>
          <span>{message}</span>
          <button className="notification__popup-close" onClick={onClose}>
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default Notification;
