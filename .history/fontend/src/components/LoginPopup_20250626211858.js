import React, { useState } from "react";
import useHttp from "../hooks/useHttp";
import "./auth.scss";
import ForgotForm from "./small/ForgotForm";
import LoginForm from "./small/LoginForm";

const LoginPopup = ({ toggleLoginPopup, onLoginSuccess }) => {
  const [mode, setMode] = useState("login"); // "login" hoặc "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { request } = useHttp();

  //====================== ✅ Xử lý đăng nhập
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await request(
        "POST",
        "http://localhost:5000/api/user/auth/login",
        { email, password },
        "Đăng nhập"
      );

      localStorage.setItem("user", JSON.stringify(res.user));
      onLoginSuccess(res.user);
      toggleLoginPopup(); // Đóng popup

      // Điều hướng theo quyền
      window.location.href = res.user.role === 1 ? "/admin" : "/";
    } catch (err) {
      alert("❌ Lỗi đăng nhập: " + err.message);
      setPassword("");
    }
  };

  //====================== ✅ Xử lý quên mật khẩu
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      await request(
        "POST",
        "http://localhost:5000/api/user/auth/forgot",
        { email },
        "Gửi mã"
      );
      alert("📧 Mã khôi phục đã gửi đến email!");
      setMode("login"); // Quay lại đăng nhập
    } catch (err) {
      alert("❌ Gửi mã thất bại: " + err.message);
    }
  };

  return (
    <div className="popup-overlay" onClick={toggleLoginPopup}>
      <div className="popup-wrapper" onClick={(e) => e.stopPropagation()}>
        <section className="login-section card shadow-2-strong">
          <div className="card-body p-5 text-center">
         

            <h3 className="mb-4">
              {mode === "login" ? "Đăng nhập" : "Quên mật khẩu"}
            </h3>

            {/* Giao diện tương ứng với chế độ */}
            {mode === "login" ? (
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={handleLoginSubmit}
                switchToForgot={() => setMode("forgot")}
              />
            ) : (
              <ForgotForm
                email={email}
                setEmail={setEmail}
                onSubmit={handleForgotSubmit}
                switchToLogin={() => setMode("login")}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPopup;
