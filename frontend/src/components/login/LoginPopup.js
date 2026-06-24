import { jwtDecode } from "jwt-decode";
import React, { useState } from "react";
import { API_BASE } from "../../constants";
import useHttp from "../../hooks/useHttp";
import "../auth.scss";
import { useNavigate } from "react-router-dom";
import ResetPasswordForm from "./Forgot/ResetPasswordForm";
import ForgotForm from "./Forgot/SendCodeForm";
import VerifyCodeForm from "./Forgot/VerifyCodeForm";
import LoginForm from "./LoginForm";

const LoginPopup = ({ toggleLoginPopup, onLoginSuccess }) => {
  const navigate = useNavigate(); 
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
  // 🔐 Mã người dùng nhập; backend sẽ đối chiếu với mã đang lưu trong session.
  const [resetCode, setResetCode] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");
  const [rememberLogin, setRememberLogin] = useState(false);
  const { request } = useHttp();
  const googleClientId = String(
    process.env.REACT_APP_GOOGLE_CLIENT_ID || "",
  ).trim();
  const facebookAppId = String(
    process.env.REACT_APP_FACEBOOK_APP_ID || "",
  ).trim();

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // 🔑 Đăng nhập tài khoản thường (email + mật khẩu).
  // Thành công: lưu token + user vào localStorage, sau đó điều hướng theo role.
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await request("POST", `${API_BASE}/api/user/auth/login`, {
        email,
        password,
      });
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("authRemember", rememberLogin ? "true" : "false");
      sessionStorage.setItem("authSessionActive", "true");
      const decoded = jwtDecode(res.accessToken);
      localStorage.setItem("user", JSON.stringify(decoded));
      onLoginSuccess(decoded);
      toggleLoginPopup();
      alert(`🎉 Đăng nhập thành công! Xin chào, ${decoded.name}`);
      if (decoded.role === 1) {
        navigate("/admin");
      } else {
        toggleLoginPopup();
      }
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
        { email, use: "forgot" },
      );

      if (response.success) {
        setForgotMessage({ success: true, message: response.message });
        setResetCode("");
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
        { email, code: resetCode, newPassword },
      );
      setPassword("");
      setResetCode("");
      setResetSuccessMessage(res.message || "Đổi mật khẩu thành công!");
      setStep(5);
    } catch (err) {
      alert("❌ Lỗi đổi mật khẩu: " + err.message);
    }
  };

  const goToLoginAfterReset = () => {
    setForgotMessage("");
    setLoginError("");
    setResetSuccessMessage("");
    setStep(1);
  };

  const goHomeAfterReset = () => {
    setForgotMessage("");
    setLoginError("");
    setResetSuccessMessage("");
    toggleLoginPopup();
    navigate("/");
  };

  // 🔁 Gửi lại mã khôi phục cho cùng email hiện tại.
  const handleResend = async () => {
    const response = await request(
      "POST",
      `${API_BASE}/api/user/auth/sendVerificationCode`,
      {
        email,
        use: "forgot",
      },
    );

    if (response.success) {
      setResetCode("");
    }
  };

  // ✅ Ghi nhận mã người dùng nhập. Backend sẽ xác thực khi đặt lại mật khẩu.
  const handleVerifyCodeSubmit = (codeInput) => {
    setResetCode(String(codeInput || "").trim());
    nextStep();
  };

  // 🌐 Nhận authorization code từ Google, backend xác thực và trả JWT của hệ thống.
  const handleGoogleCode = async (code) => {
    try {
      setLoginError("");
      const res = await request(
        "POST",
        `${API_BASE}/api/user/auth/google-login`,
        { code },
      );

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("authRemember", "true");
      sessionStorage.setItem("authSessionActive", "true");

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
  const handleFacebookAccessToken = async (
    accessToken,
    facebookProfile = null,
  ) => {
    try {
      setLoginError("");
      const res = await request(
        "POST",
        `${API_BASE}/api/user/auth/facebook-login`,
        {
          accessToken,
          facebookProfile,
        },
      );

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("authRemember", "true");
      sessionStorage.setItem("authSessionActive", "true");

      const decoded = jwtDecode(res.accessToken);
      const mergedUser = {
        ...decoded,
        email:
          decoded?.email ||
          String(facebookProfile?.email || "")
            .trim()
            .toLowerCase() ||
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
                    : step === 4
                      ? "Đổi mật khẩu"
                      : "Hoàn tất"}
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
                rememberLogin={rememberLogin}
                setRememberLogin={setRememberLogin}
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

            {step === 5 && (
              <div className="reset-success-panel">
                <div className="reset-success-icon">✓</div>
                <h4>Đổi mật khẩu thành công</h4>
                <p>{resetSuccessMessage}</p>
                <div className="reset-success-actions">
                  <button type="button" className="btn-login-now" onClick={goToLoginAfterReset}>
                    Quay lại đăng nhập
                  </button>
                  <button type="button" className="btn-home-now" onClick={goHomeAfterReset}>
                    Về trang chủ
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPopup;
