import React, { useState } from "react";

const ResetPasswordForm = ({ onSubmit, goBack }) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password.length < 6) {
      return setError("🔒 Mật khẩu phải có ít nhất 6 ký tự.");
    }

    if (password !== confirm) {
      return setError("❌ Mật khẩu không khớp.");
    }

    setError("");
    onSubmit(password); // Gửi mật khẩu mới lên
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-outline mb-3" style={{ position: "relative" }}>
        <input
          type={showPassword ? "text" : "password"}
          className="form-control"
          placeholder="Nhập mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {password && (
          <img
            src={showPassword ? "/assets/icons/icons8-hide-64.png" : "/assets/icons/icons8-eye-48.png"}
            alt="toggle"
            onClick={() => setShowPassword(!showPassword)}
            
          />
        )}
      </div>

      <div className="form-outline mb-3" style={{ position: "relative" }}>
        <input
          type={showConfirm ? "text" : "password"}
          className="form-control"
          placeholder="Xác nhận mật khẩu"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {confirm && (
          <img
            src={showConfirm ? "/assets/icons/icons8-hide-64.png" : "/assets/icons/icons8-eye-48.png"}
            alt="toggle"
            onClick={() => setShowConfirm(!showConfirm)}
            
          />
        )}
      </div>

      {error && (
        <p className="text-danger mb-2">
          <i className="text-danger me-2"></i>{error}
        </p>
      )}

      <button type="submit" className="btn btn-success w-100">Đổi mật khẩu</button>

      <button
        type="button"
        onClick={goBack}
        className="btn btn-link d-block text-decoration-none mt-2 p-0"
      >
        ← Quay lại xác minh
      </button>
    </form>
  );
};

export default ResetPasswordForm;
