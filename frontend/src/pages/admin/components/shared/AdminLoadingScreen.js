import lottie from "lottie-web";
import React, { useEffect, useRef } from "react";

const AdminLoadingScreen = ({ message = "Đang tải dữ liệu...", compact = false, className = "" }) => {
  const animationRef = useRef(null);

  useEffect(() => {
    if (!animationRef.current) return undefined;

    const anim = lottie.loadAnimation({
      container: animationRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/animations/Trail loading.json",
    });

    return () => anim.destroy();
  }, []);

  const classes = ["admin-loading-screen", compact ? "admin-loading-screen--compact" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="status" aria-live="polite">
      <div ref={animationRef} className="admin-loading-screen__animation" />
      <p className="admin-loading-screen__text">{message}</p>
    </div>
  );
};

export default AdminLoadingScreen;