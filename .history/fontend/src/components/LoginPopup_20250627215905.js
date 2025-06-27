import React, { useState } from "react";
import { API_BASE } from "../constants";
import useHttp from "../hooks/useHttp";
import "./auth.scss";

import ResetPasswordForm from "./small/Forgot/ResetPasswordForm";
import ForgotForm from "./small/Forgot/SendCodeForm";
import VerifyCodeForm from "./small/Forgot/VerifyCodeForm";
import LoginForm from "./small/LoginForm";

const LoginPopup = ({ toggleLoginPopup, onLoginSuccess }) => {
  const [step, setStep] = useState(1); // 1: login, 2: forgot, 3: verify, 4: reset password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");
  const { request } = useHttp();

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // ==== Đăng nhập ====
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await request(
        "POST",
        `${API_BASE}/api/user/auth/login`,
        { email, password },
        "Đăng nhập"
      );
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

  // ==== Gửi mã xác thực ====
  const handleSendCodeForm = async (e) => {
    e.preventDefault();
    try {
      const response = await request(
        "POST",
        `${API_BASE}/api/user/auth/sendVerificationCode`,
        { email, use: "forgot" },
        "Gửi mã"
      );
      console.log(re)
      setForgotMessage({ success: response.success, message: response.message });
      if (response.success) {
        setTimeout(() => nextStep(), 1000);
      }
    } catch (err) {
      alert("❌ Gửi mã thất bại: " + err.message);
    }
  };

  // ==== Xác thực mã ====
  const handleVerifyCodeSubmit = async (code) => {
    try {
      const res = await request(
        "POST",
        `${API_BASE}/api/user/auth/verifyCode`,
        { email, code },
        "Xác thực"
      );
      if (res.success) {
        setVerifiedCode(code);
        nextStep(); // Tới bước 4 - đổi mật khẩu
      } else {
        alert(res.message || "❌ Mã xác thực không đúng");
      }
    } catch (err) {
      alert("❌ Lỗi xác thực: " + err.message);
    }
  };

  // ==== Đổi mật khẩu ====
  const handleResetPassword = async (newPassword) => {
    try {
      const res = await request(
        "POST",
        `${API_BASE}/api/user/auth/resetPassword`,
        { email, code: verifiedCode, newPassword },
        "Đổi mật khẩu"
      );
      alert(res.message || "🎉 Đổi mật khẩu thành công!");
      setStep(1); // Quay về đăng nhập
    } catch (err) {
      alert("❌ Lỗi đổi mật khẩu: " + err.message);
    }
  };

  const handleResend = async () => {
    await request("POST", `${API_BASE}/api/user/auth/sendVerificationCode`, {
      email,
      use: "forgot",
    });
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
                : step === 3
                ? "Xác thực mã"
                : "Đổi mật khẩu"}
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
                goBack={prevStep}
              />
            )}

            {step === 4 && (
              <ResetPasswordForm
                onSubmit={handleResetPassword}
                goBack={() => setStep(3)}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPopup;
