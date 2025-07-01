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
  const [serverCode, setServerCode] = useState(""); // ✅ mã server trả về
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

      if (response.success) {
        setForgotMessage({ success: true, message: response.message });
        setServerCode(response.code);        // ✅ lưu mã trả về
        setTimeout(() => nextStep(), 0);  // Chuyển sang bước xác thực
      }
    } catch (err) {
      alert("❌ Lỗi gửi mã: " + err.message);
    }
  };

  // ==== Đổi mật khẩu ====
  const handleResetPassword = async (newPassword) => {
    try {
      alert(serverCode)
      const res = await request(
        "POST",
        `${API_BASE}/api/user/auth/resetPassword`,
        { email, code: serverCode, newPassword }, // Dùng mã cũ đã xác thực
        "Đổi mật khẩu"
      );
      alert(res.message || "🎉 Đổi mật khẩu thành công!");
      setStep(1); // Quay về đăng nhập
    } catch (err) {
      alert("❌ Lỗi đổi mật khẩu: " + err.message);
    }
  };

  const handleResend = async () => {
    const response = await request("POST", `${API_BASE}/api/user/auth/sendVerificationCode`, {
      email,
      use: "forgot",
    });

    if (response.success && response.code) {
      setServerCode(response.code); // Cập nhật lại mã mới
    }
  };

  // ✅ Xác thực mã (client-side)
  const handleVerifyCodeSubmit = (codeInput) => {
    if (codeInput !== serverCode) {
      alert("❌ Mã xác thực không đúng!");
      return;
    }
    nextStep(); // Mã đúng → sang bước đổi mật khẩu
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
                codeServer={serverCode}           // ✅ truyền mã vào
                onSubmit={handleVerifyCodeSubmit} // ✅ so sánh client-side
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
