import React, { useState } from "react";

const ResetPasswordForm = ({ onSubmit, goBack }) => {
  // 🔒 Dữ liệu nhập mật khẩu mới
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // ⚠️ Thông báo lỗi validate local
  const [error, setError] = useState("");
  // 👁️ Điều khiển ẩn/hiện password để người dùng dễ kiểm tra
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ Rule tối thiểu: 6 ký tự
    if (password.length < 6) {
      return setError("🔒 Mật khẩu phải có ít nhất 6 ký tự.");
    }

    // ✅ Rule khớp xác nhận mật khẩu
    if (password !== confirm) {
      return setError("❌ Mật khẩu không khớp.");
    }

    setError("");
    // 🚀 Gửi mật khẩu mới cho tầng xử lý của LoginPopup
    onSubmit(password);
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
        // 🚨 Khối hiển thị lỗi validate
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