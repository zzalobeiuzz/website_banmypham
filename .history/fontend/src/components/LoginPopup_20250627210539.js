import React, { useState } from "react";
import useHttp from "../hooks/useHttp";
import "./auth.scss";

import ForgotForm from "./small/Forgot/SendCodeForm";
import VerifyCodeForm from "./small/Forgot/VerifyCodeForm"; // Form nhập mã xác thực
import LoginForm from "./small/LoginForm";

const LoginPopup = ({ toggleLoginPopup, onLoginSuccess }) => {
  const [step, setStep] = useState(1); // 1: login, 2: forgot, 3: verify
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const { request } = useHttp();

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  //====================== ✅ Xử lý đăng nhập ======================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await request("POST", "http://localhost:5000/api/user/auth/login", { email, password }, "Đăng nhập");
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

  //====================== ✅ Gửi mã xác thực ======================
  const handleSendCodeForm = async (e) => {
    e.preventDefault();
    try {
      const response = await request("POST", "http://localhost:5000/api/user/auth/sendVerificationCode", {
        email,
        use: "forgot",
      });

      setForgotMessage({ success: response.success, message: response.message });

      if (response.success) {
        setTimeout(() => {
          nextStep(); // ⬅ Chuyển sang bước verify
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
      setStep(1); // Quay lại login sau khi đổi mật khẩu
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
              {step === 1 ? "Đăng nhập" : step === 2 ? "Quên mật khẩu" : "Xác thực mã"}
            </h3>

            {/* === LOGIN FORM === */}
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

            {/* === SEND CODE FORM === */}
            {step === 2 && (
              <ForgotForm
                email={email}
                setEmail={setEmail}
                onSubmit={handleSendCodeForm}
                switchToLogin={() => {
                  setForgotMessage("");
                  prevStep(); // Quay lại login
                }}
                message={forgotMessage}
              />
            )}

            {/* === VERIFY CODE FORM === */}
            {step === 3 && (
              <VerifyCodeForm
                email={email}
                onSubmit={handleVerifyCodeSubmit}
                onResend={handleResend}
                goBack={prevStep}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPopup;
