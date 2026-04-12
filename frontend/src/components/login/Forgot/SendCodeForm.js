import React from "react";

const ForgotForm = ({ email, setEmail, onSubmit, switchToLogin, message }) => {
  return (
    <section className="forgot-section">
      {/* 📩 Bước 1 của flow quên mật khẩu: nhận email để gửi mã */}
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

        <button type="submit" className="btn btn-warning w-100">
          Gửi mã khôi phục
        </button>

        {/* ⚠️ Chỉ hiện lỗi khi server trả thất bại */}
        {message && message.success === false && (
          <p className="text-danger mt-2 mb-0">{message.message}</p>
        )}

        <button
          type="button"
          onClick={switchToLogin}
          className="btn btn-link d-block p-0 text-decoration-none w-100 mt-2"
        >
          {/* ↩️ Quay lại bước đăng nhập */}
          ← Quay lại đăng nhập
        </button>
      </form>
    </section>
  );
};

export default ForgotForm;