import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import successAnimation from "../Success.json";
import "../components.scss";

const STATUS_CONFIG = {
  success: {
    className: "success",
    title: "Thành công",
    buttonText: "Đóng",
  },
  error: {
    className: "error",
    title: "Có lỗi xảy ra",
    buttonText: "Đóng",
  },
  warning: {
    className: "warning",
    title: "Cảnh báo",
    buttonText: "Đóng",
  },
  info: {
    className: "info",
    title: "Thông báo",
    buttonText: "Đóng",
  },
};

const PopupNotification = ({
  open,
  status = "info",
  message = "",
  onClose,
  onConfirm,
  confirmText = "Xác nhận",
  closeText,
  question,
}) => {
  const animationRef = useRef(null);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const resolvedStatus = STATUS_CONFIG[status] ? status : "info";
  const config = STATUS_CONFIG[resolvedStatus];

  useEffect(() => {
    if (resolvedStatus === "success" && animationRef.current && open) {
      setAnimationCompleted(false);
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

    return undefined;
  }, [resolvedStatus, open]);

  if (!open) return null;

  return (
    <div className="notification">
      <div className="notification__overlay">
        <div className="notification__success-box notification__success-box--popup">
          {resolvedStatus === "success" ? (
            <div
              className="notification__lottie-animation"
              ref={animationRef}
              style={{ width: 180, height: 180 }}
            />
          ) : (
            <div className={`notification__badge notification__badge--${config.className}`}>
              {config.title}
            </div>
          )}

          <div
            className={`notification__content ${resolvedStatus === "success" ? (animationCompleted ? "visible" : "hidden") : "visible"}`}
          >
            <p className="notification__message">{message}</p>

            {typeof onConfirm === "function" ? (
              <>
                {question ? <p className="notification__question">{question}</p> : null}
                <div className="notification__actions">
                  <button
                    className="notification__close-btn notification__close-btn--secondary"
                    onClick={onConfirm}
                  >
                    {confirmText}
                  </button>
                  <button className="notification__close-btn" onClick={onClose}>
                    {closeText || config.buttonText}
                  </button>
                </div>
              </>
            ) : (
              <div className="notification__actions">
                <button className="notification__close-btn" onClick={onClose}>
                  {closeText || config.buttonText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupNotification;