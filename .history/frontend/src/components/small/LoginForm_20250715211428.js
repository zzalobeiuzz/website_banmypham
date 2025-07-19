import React, { useState } from "react";
import "../auth.scss";
import { UPLOAD_BASE } from "../../constants";

const LoginForm = ({ email, setEmail, password, setPassword, onSubmit, switchToForgot }) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <form onSubmit={onSubmit}>
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
        {password && (
          <img
            src={
              showPassword
                ? `${UPLOAD_BASE}/icons/icons8-hide-64.png`
                : `${UPLOAD_BASE}/icons/icons8-eye-48.png`
            }
            alt="toggle visibility"
            onClick={toggleShowPassword}
            className="toggle-password-icon"
            style={{
              position: "absolute",
              top: "50%",
              right: "10px",
              transform: "translateY(-50%)",
              cursor: "pointer",
              width: "24px",
              height: "24px",
            }}
          />
        )}
      </div>

      {/* Nhớ mật khẩu + Quên mật khẩu */}
      <div className="d-flex justify-content-between mb-3 align-items-center">
        <div className="form-check">
          <input type="checkbox" id="remember" className="form-check-input" />
          <label htmlFor="remember" className="form-check-label ms-1">Ghi nhớ</label>
        </div>
        <button
          type="button"
          onClick={switchToForgot}
          className="btn btn-link p-0 text-decoration-none"
          style={{ fontSize: "14px" }}
        >
          Quên mật khẩu?
        </button>
      </div>

      {/* Nút đăng nhập */}
      <button type="submit" className="btn btn-primary w-100 mb-3">Đăng nhập</button>

      {/* Đăng ký */}
      <div className="text-center mt-3">
        <span>Bạn chưa có tài khoản? </span>
        <a href="/signup" className="text-decoration-none text-primary">
          Đăng ký
        </a>
      </div>

      <hr className="my-3" />

      {/* Đăng nhập MXH */}
      <button
        type="button"
        className="btn btn-outline-danger w-100 mb-2"
        onClick={() => alert("👉 Tích hợp Google ở đây")}
      >
        <i className="fab fa-google me-2"></i> Đăng nhập bằng Google
      </button>

      <button
        type="button"
        className="btn btn-outline-primary w-100"
        onClick={() => alert("👉 Tích hợp Facebook ở đây")}
      >
        <i className="fab fa-facebook-f me-2"></i> Đăng nhập bằng Facebook
      </button>
    </form>
  );
};

export default LoginForm;
