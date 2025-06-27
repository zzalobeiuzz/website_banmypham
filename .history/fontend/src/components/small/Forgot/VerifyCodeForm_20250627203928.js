import React, { useEffect, useState } from "react";

const VerifyCodeForm = ({ email, onSubmit, onResend }) => {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [countdown, setCountdown] = useState(120); // 120 giây đếm ngược
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  // ⏱️ Đếm ngược thời gian gửi lại mã
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    setResending(true);
    try {
      await onResend(); // Gọi hàm gửi lại mã từ props
      setCountdown(120); // Reset lại thời gian
    } catch (err) {
      setError("❌ Không thể gửi lại mã.");
    }
    setResending(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      return setError("🔴 Mã xác thực phải gồm 6 chữ số.");
    }
    if (newPassword.length < 6) {
      return setError("🔴 Mật khẩu mới phải ít nhất 6 ký tự.");
    }
    setError("");
    await onSubmit(code, newPassword);
  };

  return (
    <section className="verify-section">
      <form onSubmit={handleSubmit}>
        <div className="form-outline mb-3">
          <input
            type="text"
            maxLength="6"
            className="form-control text-center"
            placeholder="Nhập mã xác thực (6 số)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>

        <div className="form-outline mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        {/* Thông báo lỗi */}
        {error && <p className="text-danger mb-2">❌ {error}</p>}

        {/* Nút gửi lại mã */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className="btn btn-link p-0 text-decoration-none"
          >
            {countdown > 0
              ? `Gửi lại mã sau ${countdown}s`
              : resending
              ? "Đang gửi lại..."
              : "Gửi lại mã"}
          </button>
        </div>

        <button type="submit" className="btn btn-success w-100">
          Đổi mật khẩu
        </button>
      </form>
    </section>
  );
};

export default VerifyCodeForm;
