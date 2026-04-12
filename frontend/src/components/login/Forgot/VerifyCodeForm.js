import React, { useEffect, useState } from "react";

const VerifyCodeForm = ({ onSubmit, onResend, goBack }) => {
  // 🔢 Mã OTP người dùng nhập
  const [code, setCode] = useState("");
  // ⏱️ Countdown để hạn chế spam gửi lại mã
  const [countdown, setCountdown] = useState(120);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  // ⏲️ Đếm ngược mỗi giây đến khi về 0.
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    // 🔁 Gửi lại mã và reset lại thời gian chờ
    setResending(true);
    try {
      await onResend();
      setCountdown(120);
      setError("");
    } catch (err) {
      setError("❌ Không thể gửi lại mã.");
    }
    setResending(false);
  };

  const handleSubmit = async (e) => {
    // ✅ Validate nhanh phía client trước khi gửi lên tầng xử lý tiếp theo
    e.preventDefault();
    if (code.length !== 6) {
      return setError("🔴 Mã xác thực phải gồm đúng 6 chữ số.");
    }
    setError("");
    await onSubmit(code);
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

        {/* 🚨 Lỗi định dạng hoặc lỗi gửi lại mã */}
        {error && <p className="text-danger mb-2">❌ {error}</p>}

        <div className="mb-3 text-end">
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className="btn btn-link text-decoration-none p-0"
          >
            {/* 🧠 Hiển thị trạng thái động: chờ, đang gửi, hoặc sẵn sàng gửi lại */}
            {countdown > 0
              ? `Gửi lại mã sau ${countdown}s`
              : resending
                ? "Đang gửi lại..."
                : "🔁 Gửi lại mã"}
          </button>
        </div>

        <div className="d-flex justify-content-between">
          <button
            type="button"
            onClick={goBack}
            className="btn btn-secondary"
          >
            ⬅ Quay lại
          </button>
          <button
            type="submit"
            className="btn btn-success"
          >
            Xác thực mã
          </button>
        </div>
      </form>
    </section>
  );
};

export default VerifyCodeForm;