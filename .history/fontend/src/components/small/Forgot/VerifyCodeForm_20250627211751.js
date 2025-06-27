import React, { useEffect, useState } from "react";

const VerifyCodeForm = ({ email, onSubmit, onResend }) => {
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(120); // 2 phút
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  // ⏱️ Đếm ngược
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 📩 Gửi lại mã
  const handleResend = async () => {
    setResending(true);
    try {
      await onResend();       // Gọi từ props
      setCountdown(120);      // Reset thời gian
      setError("");
    } catch (err) {
      setError("❌ Không thể gửi lại mã.");
    }
    setResending(false);
  };

  // ✅ Submit mã xác thực
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      return setError("🔴 Mã xác thực phải gồm đúng 6 chữ số.");
    }
    setError("");
    await onSubmit(code); // Truyền mã lên component cha
  };

  return (
    <section className="verify-section">
      <form onSubmit={handleSubmit}>
        <div className="form-outline mb-3">
          <input
            type="text"
            maxLength={6}
            className="form-control text-center"
            placeholder="Nhập mã xác thực (6 số)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-danger mb-2">❌ {error}</p>}

        <div className="mb-3 text-end">
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className="btn btn-link text-decoration-none p-0"
          >
            {countdown > 0
              ? `Gửi lại mã sau ${countdown}s`
              : resending
              ? "Đang gửi lại..."
              : "🔁 Gửi lại mã"}
          </button>
        </div>

        <button type="submit" className="btn btn-success w-100">
          Xác thực mã
        </button>
      </form>
    </section>
  );
};

export default VerifyCodeForm;
