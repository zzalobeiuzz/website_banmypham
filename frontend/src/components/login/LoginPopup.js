import { jwtDecode } from "jwt-decode";
import React, { useState } from "react";
import { API_BASE } from "../../constants";
import useHttp from "../../hooks/useHttp";
import "../auth.scss";

import ResetPasswordForm from "./Forgot/ResetPasswordForm";
import ForgotForm from "./Forgot/SendCodeForm";
import VerifyCodeForm from "./Forgot/VerifyCodeForm";
import LoginForm from "./LoginForm";

const LoginPopup = ({ toggleLoginPopup, onLoginSuccess }) => {
  // 🧭 Điều hướng các bước trong popup:
  // 1 = Đăng nhập, 2 = Quên mật khẩu, 3 = Xác thực mã, 4 = Đặt lại mật khẩu
  const [step, setStep] = useState(1);
  // 📝 Dữ liệu form dùng chung giữa các bước
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // ⚠️ Lỗi đăng nhập hiển thị ngay trên form
  const [loginError, setLoginError] = useState("");
  // 📣 Thông báo từ bước quên mật khẩu
  const [forgotMessage, setForgotMessage] = useState("");
  // 🔐 Mã xác thực server trả về (session hiện tại)
  const [serverCode, setServerCode] = useState("");
  const { request } = useHttp();
  const googleClientId = String(process.env.REACT_APP_GOOGLE_CLIENT_ID || "").trim();
  const facebookAppId = String(process.env.REACT_APP_FACEBOOK_APP_ID || "").trim();

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // 🔑 Đăng nhập tài khoản thường (email + mật khẩu).
  // Thành công: lưu token + user vào localStorage, sau đó điều hướng theo role.
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await request(
        "POST",
        `${API_BASE}/api/user/auth/login`,
        { email, password }
      );
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      const decoded = jwtDecode(res.accessToken);
      localStorage.setItem("user", JSON.stringify(decoded));
      onLoginSuccess(decoded);
      toggleLoginPopup();
      alert(`🎉 Đăng nhập thành công! Xin chào, ${decoded.name}`);
      window.location.href = decoded.role === 1 ? "/admin" : "/";
    } catch (err) {
      setLoginError(err?.message || "Sai email hoặc mật khẩu");
      setPassword("");
    }
  };

  const handleSendCodeForm = async (e) => {
    e.preventDefault();
    try {
      const response = await request(
        "POST",
        `${API_BASE}/api/user/auth/sendVerificationCode`,
        { email, use: "forgot" }
      );

      if (response.success) {
        setForgotMessage({ success: true, message: response.message });
        setServerCode(response.code);
        setTimeout(() => nextStep(), 0);
      }
    } catch (err) {
      alert("❌ Lỗi gửi mã: " + err.message);
    }
  };

  const handleResetPassword = async (newPassword) => {
    try {
      const res = await request(
        "POST",
        `${API_BASE}/api/user/auth/resetPassword`,
        { email, code: serverCode, newPassword }
      );
      alert(res.message || "🎉 Đổi mật khẩu thành công!");
      setStep(1);
    } catch (err) {
      alert("❌ Lỗi đổi mật khẩu: " + err.message);
    }
  };

  // 🔁 Gửi lại mã khôi phục cho cùng email hiện tại.
  const handleResend = async () => {
    const response = await request("POST", `${API_BASE}/api/user/auth/sendVerificationCode`, {
      email,
      use: "forgot",
    });

    if (response.success && response.code) {
      setServerCode(response.code);
    }
  };

  // ✅ So sánh mã người dùng nhập với mã server vừa cấp trong phiên hiện tại.
  // Đúng mã thì chuyển sang bước đổi mật khẩu.
  const handleVerifyCodeSubmit = (codeInput) => {
    if (codeInput !== serverCode) {
      alert("❌ Mã xác thực không đúng!");
      return;
    }
    nextStep();
  };

  // 🌐 Nhận authorization code từ Google, backend xác thực và trả JWT của hệ thống.
  const handleGoogleCode = async (code) => {
    try {
      setLoginError("");
      const res = await request("POST", `${API_BASE}/api/user/auth/google-login`, { code });

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);

      const decoded = jwtDecode(res.accessToken);
      localStorage.setItem("user", JSON.stringify(decoded));

      onLoginSuccess(decoded);
      toggleLoginPopup();
      window.location.href = decoded.role === 1 ? "/admin" : "/";
    } catch (err) {
      setLoginError(err?.message || "Đăng nhập Google thất bại.");
    }
  };

  // 🌐 Nhận access token Facebook, backend xác thực token/profile và trả JWT hệ thống.
  // mergedUser dùng để giữ dữ liệu hiển thị ổn định phía client ngay sau login.
  const handleFacebookAccessToken = async (accessToken, facebookProfile = null) => {
    try {
      setLoginError("");
      const res = await request("POST", `${API_BASE}/api/user/auth/facebook-login`, {
        accessToken,
        facebookProfile,
      });

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);

      const decoded = jwtDecode(res.accessToken);
      const mergedUser = {
        ...decoded,
        email:
          decoded?.email ||
          String(facebookProfile?.email || "").trim().toLowerCase() ||
          "",
        avatar:
          decoded?.avatar ||
          String(facebookProfile?.picture?.data?.url || "").trim() ||
          null,
      };

      localStorage.setItem("user", JSON.stringify(mergedUser));

      onLoginSuccess(mergedUser);
      toggleLoginPopup();
      window.location.href = mergedUser.role === 1 ? "/admin" : "/";
    } catch (err) {
      setLoginError(err?.message || "Đăng nhập Facebook thất bại.");
    }
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
                loginError={loginError}
                googleClientId={googleClientId}
                facebookAppId={facebookAppId}
                onGoogleCode={handleGoogleCode}
                onFacebookAccessToken={handleFacebookAccessToken}
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
                  setLoginError("");
                  setStep(1);
                }}
                message={forgotMessage}
              />
            )}

            {step === 3 && (
              <VerifyCodeForm
                email={email}
                codeServer={serverCode}
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