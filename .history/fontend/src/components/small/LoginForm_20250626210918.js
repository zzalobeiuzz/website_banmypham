import React from "react";

const LoginForm = ({ email, setEmail, password, setPassword, onSubmit, switchToForgot }) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-outline mb-1">
        <input
          type="email"
          className="form-control form-control-lg"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-outline mb-1">
        <input
          type="password"
          className="form-control form-control-lg"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="d-flex justify-content-between mb-3">
        <div>
          <input type="checkbox" id="remember" className="form-check-input" />
          <label htmlFor="remember" className="form-check-label ms-1">Ghi nhớ</label>
        </div>
        <a href="#!" onClick={switchToForgot} className="text-decoration-none">Quên mật khẩu?</a>
      </div>

      <button type="submit" className="btn btn-primary w-100">Đăng nhập</button>
    </form>
  );
};

export default LoginForm;
