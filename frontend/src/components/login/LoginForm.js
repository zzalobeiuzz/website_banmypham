import React, { useState } from "react";
import { UPLOAD_BASE } from "../../constants";
import "../auth.scss";
import FacebookLoginButton from "./social/FacebookLoginButton";
import GoogleLoginButton from "./social/GoogleLoginButton";

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  loginError,
  googleClientId,
  facebookAppId,
  rememberLogin,
  setRememberLogin,
  onGoogleCode,
  onFacebookAccessToken,
  onSubmit,
  switchToForgot,
}) => {
  // 👁️ Chỉ điều khiển việc ẩn/hiện mật khẩu ở form đăng nhập.
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} autoComplete="on">
      {loginError && (
        // 🚨 Hiển thị lỗi backend (sai thông tin, token lỗi, v.v.)
        <div className="login-error-message" role="alert">
          {loginError}
        </div>
      )}

      <div className="form-outline mb-4">
        {/* 📧 Input email đăng nhập */}
        <input
          type="email"
          name="email"
          className="form-control form-control-lg"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
      </div>

      <div className="form-outline mb-4 position-relative">
        {/* 🔒 Input mật khẩu */}
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          className="form-control form-control-lg"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {password && (
          // 👁️ Icon chỉ hiện khi có giá trị để tránh rối giao diện
          <img
            src={showPassword
              ? `${UPLOAD_BASE}/icons/icons8-hide-64.png`
              : `${UPLOAD_BASE}/icons/icons8-eye-48.png`}
            alt="toggle visibility"
            onClick={() => setShowPassword((prev) => !prev)}
            loading="lazy"
          />
        )}
      </div>

      <div className="d-flex justify-content-between mb-3">
        {/* 🧠 Checkbox ghi nhớ (UI-level) */}
        <div>
          <input
            type="checkbox"
            id="remember"
            className="form-check-input"
            checked={rememberLogin}
            onChange={(e) => setRememberLogin(e.target.checked)}
          />
          <label htmlFor="remember" className="form-check-label ms-1">Ghi nhớ</label>
        </div>
        <button
          // 🛟 Chuyển sang flow quên mật khẩu
          type="button"
          onClick={switchToForgot}
          className="btn btn-link p-0 text-decoration-none"
          style={{ width: "40%" }}
        >
          Quên mật khẩu?
        </button>
      </div>

      <button type="submit" className="btn btn-primary mb-3">Đăng nhập</button>

      <div className="text-center mt-3">
        <span>Bạn chưa có tài khoản? </span>
        <a href="/signup" className="text-decoration-none text-primary">
          Đăng ký
        </a>
      </div>

      {/* 🌐 Social sign-in được tách component để dễ bảo trì/mở rộng provider */}
      <hr className="my-3" />
      <GoogleLoginButton googleClientId={googleClientId} onGoogleCode={onGoogleCode} />
      <FacebookLoginButton
        facebookAppId={facebookAppId}
        onFacebookAccessToken={onFacebookAccessToken}
      />
    </form>
  );
};

export default LoginForm;
