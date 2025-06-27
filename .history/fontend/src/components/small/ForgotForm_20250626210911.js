import React from "react";

const ForgotForm = ({ email, setEmail, onSubmit, switchToLogin }) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-outline mb-3">
        <input
          type="email"
          className="form-control"
          placeholder="Nhập email để khôi phục"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="btn btn-warning w-100">Gửi mã khôi phục</button>
      <a href="#!" onClick={switchToLogin} className="d-block mt-2 text-decoration-none">← Quay lại đăng nhập</a>
    </form>
  );
};

export default ForgotForm;
