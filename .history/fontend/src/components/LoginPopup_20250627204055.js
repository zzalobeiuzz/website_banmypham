import React, { useState } from "react";
import useHttp from "../hooks/useHttp";
import "./auth.scss";
import ForgotForm from "./small/Forgot/SendCodeForm";
import LoginForm from "./small/LoginForm";
import VerifyCodeForm from "./small/Forgot/VerifyCodeForm"; // ✅ Thêm form xác thực mã

const LoginPopup = ({ toggleLoginPopup, onLoginSuccess }) => {
  const [step, setStep] = useState("login"); // "login", "forgot", "verify"
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

  //====================== ✅ Gửi mã xác thực quên mật khẩu ======================
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
          setStep("verify"); // ✅ Chuyển sang bước nhập mã
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
      setStep("login"); // Quay lại login
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
              {step === "login"
                ? "Đăng nhập"
                : step === "forgot"
                ? "Quên mật khẩu"
                : "Xác thực mã"}
            </h3>

            {step === "login" && (
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={handleLoginSubmit}
                switchToForgot={() => setStep("forgot")}
              />
            )}

            {step === "forgot" && (
              <ForgotForm
                email={email}
                setEmail={setEmail}
                onSubmit={handleSendCodeForm}
                switchToLogin={() => {
                  setForgotMessage("");
                  setStep("login");
                }}
                message={forgotMessage}
              />
            )}

            {step === "verify" && (
              <VerifyCodeForm
                email={email}
                onSubmit={handleVerifyCodeSubmit}
                onResend={handleResend}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPopup;
