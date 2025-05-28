import React from "react";
import "../components/auth.scss";
import WizardForm from "../components/small/WizardForm";
const Signup = () => {
  return (
    <section className="sign-up video-bg-container">
      <video autoPlay muted loop playsInline className="video-bg">
        <source src="/assets/video/bg-video.mp4" type="video/mp4" />
      </video>
      <div className="container">
        <div className="row justify-content-end me-3">
          <div className="welcome col-12  col-md-9 col-lg-7 col-xl-6 col-xxl-6 mt-5">
            <div className="text-center mb-4">
              <a href="./" >
                <img
                  src="./assets/images/logo-removebg.png"
                  alt="BootstrapBrain Logo"
                  className="mb-5"
                />
              </a>
              <h3 className="mb-4 h3">Đăng kí ngay để được</h3>
              <ul>
                <li>

                  <img
                    src="./assets/icons/icons8-tick.gif"
                    alt="icon"
                  />
                  Tư vấn chuyên sâu miễn phí
                </li>
                <li>

                  <img
                    src="/assets/icons/icons8-tick.gif"
                    alt="icon"
                  />
                  Các ưu đãi mừng đăng kí
                </li>
                <li>              <img
                    src="/assets/icons/icons8-tick.gif"
                    alt="icon"
                  />
                  Hỗ trợ tận tâm
                </li>
                <li>

                  <img
                    src="/assets/icons/icons8-tick.gif"
                    alt="icon"
                  />
                  Tham gia các sự kiện khuyến mãi của chúng tôi
                </li>
              </ul>
            </div>
          </div>
          <div className="form-signup col-12 col-md-9 col-lg-7 col-xl-6 col-xxl-6">
            <WizardForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
