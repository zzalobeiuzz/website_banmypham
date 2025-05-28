import React from "react";
import "../components/auth.scss";
// import WizardForm from "../components/small/WizardForm"; // Thêm dòng này

const Signup = () => {
  return (
    <section className="sign-up video-bg-container">
      <video autoPlay muted loop playsInline className="video-bg">
        <source src="/assets/video/bg-video.mp4" type="video/mp4" />
      </video>
      <div className="container">
        <div className="row justify-content-end me-3">
          <div className="welcome col-12 col-md-9 col-lg-7 col-xl-6 col-xxl-6 mt-5">
            {/* ... giữ nguyên phần bên trái ... */}
          </div>

          {/* 💡 Thay phần form-signup bằng WizardForm */}
          <div className="form-signup col-12 col-md-9 col-lg-7 col-xl-6 col-xxl-6">
            <WizardForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
