import React, { useState } from "react";
import { UPLOAD_BASE } from "../../constants";
import '../auth.scss';

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
        {/* Icon chỉ hiện khi có giá trị */}
        {password && (
          <img
            src={showPassword ?
              `${UPLOAD_BASE}/assets/icons/icons8-hide-64.png`
              : `${UPLOAD_BASE}assets/icons/icons8-eye-48.png`}
            alt="toggle visibility"
            onClick={toggleShowPassword}

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
        onClick={() => alert("👉 Tích hợp Google ở đây")}
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
