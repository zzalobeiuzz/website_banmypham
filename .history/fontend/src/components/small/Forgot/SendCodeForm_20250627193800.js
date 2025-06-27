import React from "react";

const ForgotForm = ({ email, setEmail, onSubmit, switchToLogin, message }) => {
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
      {/* 👇 Hiển thị message chỉ khi không có tài khoản người dùng */}
      {message && message.success === false && (
        <p className="text-danger">{message.message}</p>
      )}
      <a href="#Login" onClick={switchToLogin} className="d-block mt-2 text-decoration-none">← Quay lại đăng nhập</a>
    </form>
  );
};

export default ForgotForm;
