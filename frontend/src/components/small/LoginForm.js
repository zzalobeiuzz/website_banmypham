import React, { useEffect, useState } from "react";
import { UPLOAD_BASE } from "../../constants";
import '../auth.scss';

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  loginError,
  googleClientId,
  onGoogleCode,
  onSubmit,
  switchToForgot,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    if (!googleClientId) return;

    const existing = document.getElementById("google-identity-script");
    if (existing) {
      setGoogleReady(Boolean(window.google?.accounts?.id));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    document.body.appendChild(script);
  }, [googleClientId]);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleGoogleLogin = () => {
    if (!googleClientId) {
      window.alert("Thiếu REACT_APP_GOOGLE_CLIENT_ID ở frontend.");
      return;
    }

    if (!window.google?.accounts?.oauth2 || !googleReady) {
      window.alert("Google Sign-In chưa sẵn sàng, vui lòng thử lại.");
      return;
    }

    const codeClient = window.google.accounts.oauth2.initCodeClient({
      client_id: googleClientId,
      scope: "openid email profile",
      ux_mode: "popup",
      redirect_uri: "postmessage",
      callback: (response) => {
        if (response?.code) {
          onGoogleCode(response.code);
        }
      },
    });

    codeClient.requestCode();
  };

  return (
    <form onSubmit={onSubmit}>
      {loginError && (
        <div className="login-error-message" role="alert">
          {loginError}
        </div>
      )}

      {/* Email */}
      <div className="form-outline mb-4">
        <input
          type="email"
          className="form-control form-control-lg"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
 
      {/* Mật khẩu */}
      <div className="form-outline mb-4 position-relative">
        <input
          type={showPassword ? "text" : "password"}
          className="form-control form-control-lg"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {/* Icon chỉ hiện khi có giá trị */}
        {password && (
          <img
            src={showPassword ?
              `${UPLOAD_BASE}/icons/icons8-hide-64.png`
              : `${UPLOAD_BASE}/icons/icons8-eye-48.png`}
            alt="toggle visibility"
            onClick={toggleShowPassword}
            loading="lazy"

          />
        )}
      </div>

      {/* Nhớ mật khẩu + Quên mật khẩu */}
      <div className="d-flex justify-content-between mb-3">
        <div>
          <input type="checkbox" id="remember" className="form-check-input" />
          <label htmlFor="remember" className="form-check-label ms-1">Ghi nhớ</label>
        </div>
        <button
          type="button"
          onClick={switchToForgot}
          className="btn btn-link p-0 text-decoration-none"
          style={{ width: "40%" }}
        >
          Quên mật khẩu?
        </button>
      </div>

      {/* Nút đăng nhập */}
      <button type="submit" className="btn btn-primary mb-3">Đăng nhập</button>

      {/* Đăng ký */}
      <div className="text-center mt-3">
        <span>Bạn chưa có tài khoản? </span>
        <a href="/signup" className="text-decoration-none text-primary">
          Đăng ký
        </a>
      </div>

      {/* Đăng nhập bằng MXH */}
      <hr className="my-3" />
      <button
        type="button"
        className="btn btn-outline-danger mb-2"
        onClick={handleGoogleLogin}
      >
        <i className="fab fa-google me-2"></i> Đăng nhập bằng Google
      </button>

      <button
        type="button"
        className="btn btn-outline-primary"
        onClick={() => alert("👉 Tích hợp Facebook ở đây")}
      >
        <i className="fab fa-facebook-f me-2"></i> Đăng nhập bằng Facebook
      </button>
    </form>
  );
};

export default LoginForm;
