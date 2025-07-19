import React, { useEffect, useRef } from "react";
import "../components/auth.scss";
import WizardForm from "../components/small/WizardForm";
import { UPLOAD_BASE } from "../constants";

const Signup = () => {
  const videoRef = useRef(null); // Tham chiếu đến thẻ video

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && videoRef.current) {
        videoRef.current.play().catch((err) => {
          console.warn("Không thể tự động play lại video:", err.message);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <section className="sign-up video-bg-container">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="video-bg"
      >
        <source src="{`${UPLOAD_BASE}/video/bg-video.mp4" type="video/mp4" />
      </video>

      <div className="container">
        <div className="row justify-content-end me-3">
          {/* Phần giới thiệu bên trái */}
          <div className="welcome col-12 col-md-9 col-lg-7 col-xl-6 col-xxl-6 mt-5">
            <div className="text-center mb-4">
              {/* Click logo để quay về trang chủ */}
              <a href="./">
                <img
                  src={`${UPLOAD_BASE}/images/logo-removebg.png`}
                  alt="BootstrapBrain Logo"
                  className="mb-5"
                />
              </a>

              <h3 className="mb-4 h3">Đăng kí ngay để được</h3>
              <ul>
                {/* Danh sách các lợi ích khi đăng ký */}
                <li>
                  <img src="./assets/icons/icons8-tick.gif" alt="icon" />
                  Tư vấn chuyên sâu miễn phí
                </li>
                <li>
                  <img src="/assets/icons/icons8-tick.gif" alt="icon" />
                  Các ưu đãi mừng đăng kí
                </li>
                <li>
                  <img src="/assets/icons/icons8-tick.gif" alt="icon" />
                  Hỗ trợ tận tâm
                </li>
                <li>
                  <img src="/assets/icons/icons8-tick.gif" alt="icon" />
                  Tham gia các sự kiện khuyến mãi của chúng tôi
                </li>
              </ul>
            </div>
          </div>

          {/* Form đăng ký sử dụng WizardForm (multi-step form) */}
          <div className="form-signup col-12 col-md-9 col-lg-7 col-xl-6 col-xxl-6">
            <WizardForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
