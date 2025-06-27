import React, { useState } from "react";
import useHttp from "../hooks/useHttp";
import "./auth.scss";
import ForgotForm from "./small/Forgot/SendCodeForm";
import VerifyCodeForm from "./small/Forgot/VerifyCodeForm";
import LoginForm from "./small/LoginForm";

const LoginPopup = ({ toggleLoginPopup, onLoginSuccess }) => {
  const [step, setStep] = useState(1); // 1: login, 2: forgot, 3: verify
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const { request } = useHttp();

  //====================== ✅ Xử lý đăng nhập ======================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await request("POST", "/api/user/auth/login", { email, password }, "Đăng nhập");
      localStorage.setItem("user", JSON.stringify(res.user));
      onLoginSuccess(res.user);
      toggleLoginPopup();
      alert(`🎉 Đăng nhập thành công! Xin chào, ${res.user.name}`);
      window.location.href = res.user.role === 1 ? "/admin" : "/";
    } catch (err) {
      alert("❌ Lỗi đăng nhập: " + err.message);
      setPassword("");
    }
  };

  //====================== ✅ Gửi mã quên mật khẩu ======================
  const handleSendCodeForm = async (e) => {
    e.preventDefault();
    try {
      const response = await request("POST", "/api/user/auth/sendVerificationCode", {
        email,
        use: "forgot",
      });

      setForgotMessage({ success: response.success, message: response.message });

      if (response.success) {
        setTimeout(() => {
          setStep(3); // Sang bước xác thực mã
        }, 1000);
      }
    } catch (err) {
      alert("❌ Gửi mã thất bại: " + err.message);
    }
  };

  //====================== ✅ Xác thực mã & đổi mật khẩu ======================
  const handleVerifyCodeSubmit = async (code, newPassword) => {
    try {
      const res = await request("POST", "/api/user/auth/verifyCode", {
        email,
        code,
        newPassword,
      });
      alert(res.message || "Đổi mật khẩu thành công!");
      setStep(1); // Quay lại login
    } catch (err) {
      alert("❌ Lỗi xác thực: " + err.message);
    }
  };

  const handleResend = async () => {
    await request("POST", "/api/user/auth/sendVerificationCode", { email, use: "forgot" });
  };

  return (
    <div className="popup-overlay" onClick={toggleLoginPopup}>
      <div className="popup-wrapper" onClick={(e) => e.stopPropagation()}>
        <section className="login-section card shadow-2-strong">
          <div className="card-body p-5 text-center">
            <h3 className="mb-4">
              {step === 1
                ? "Đăng nhập"
                : step === 2
                ? "Quên mật khẩu"
                : "Xác thực mã & đặt lại mật khẩu"}
            </h3>

            {step === 1 && (
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={handleLoginSubmit}
                switchToForgot={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <ForgotForm
                email={email}
                setEmail={setEmail}
                onSubmit={handleSendCodeForm}
                switchToLogin={() => {
                  setForgotMessage("");
                  setStep(1);
                }}
                message={forgotMessage}
              />
            )}

            {step === 3 && (
              <VerifyCodeForm
                email={email}
                onSubmit={handleVerifyCodeSubmit}
                onResend={handleResend}
                goBack={() => setStep(2)} // Quay lại gửi mã
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPopup;
