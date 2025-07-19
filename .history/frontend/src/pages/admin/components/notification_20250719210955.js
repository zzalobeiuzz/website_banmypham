import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import successAnimation from "./Success.json";
import "./components.scss";

// 🔔 Component thông báo (thành công hoặc lỗi)
const Notification = ({ message, type = "success", onClose, onConfirm }) => {
  const animationRef = useRef(null);
  const [animationCompleted, setAnimationCompleted] = useState(false);

  // ✅ Chạy animation thành công bằng Lottie
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
        setAnimationCompleted(true); // 👉 Chỉ hiện nút khi chạy xong
      });

      return () => {
        anim.destroy(); // 🔥 Dọn dẹp khi component bị huỷ
      };
    }
  }, [type]);

  return (
    <div className="notification">
      {type === "success" ? (
        // ✅ Giao diện khi thành công
        <div className="notification__overlay">
          <div className="notification__success-box">
            <div
              className="notification__lottie-animation"
              ref={animationRef}
              style={{ width: 180, height: 180 }}
            />
            {/* 🧾 Nội dung sau khi animation xong */}
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
                  onClick={onConfirm} // 👉 Không => quay về
                >
                  Không
                </button>
                <button
                  className="notification__close-btn"
                  onClick={onClose} // 👉 Có => reset form
                >
                  Có
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ❌ Giao diện thông báo lỗi hoặc khác
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
