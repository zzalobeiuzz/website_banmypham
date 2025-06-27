import React from "react";
import '../auth.scss';

const LoginForm = ({ email, setEmail, password, setPassword, onSubmit, switchToForgot }) => {
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
      <div className="form-outline mb-4">
        <input
          type="password"
          className="form-control form-control-lg"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
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
      {/* Chưa có tài khoản? */}
      <div className="text-center mt-3">
        <span>Bạn chưa có tài khoản? </span>
        <a href="/signup" className="text-decoration-none text-primary fw-bold">
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
