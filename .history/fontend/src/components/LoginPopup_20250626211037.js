import React, { useState } from "react";
import useHttp from "../hooks/";
import ForgotForm from "./small/ForgotForm";
import LoginForm from "./small/LoginForm";

const LoginPopup = ({ toggleLoginPopup, onLoginSuccess }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { request } = useHttp();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await request("POST", "http://localhost:5000/api/user/auth/login", { email, password }, "Đăng nhập");
      localStorage.setItem("user", JSON.stringify(res.user));
      onLoginSuccess(res.user);
      toggleLoginPopup();
      window.location.href = res.user.role === 1 ? "/admin" : "/";
    } catch (err) {
      alert("❌ Lỗi đăng nhập: " + err.message);
      setPassword("");
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      await request("POST", "http://localhost:5000/api/user/auth/forgot", { email }, "Gửi mã");
      alert("📧 Mã khôi phục đã gửi đến email!");
      setMode("login");
    } catch (err) {
      alert("❌ Gửi mã thất bại: " + err.message);
    }
  };

  return (
    <div className="popup-overlay" onClick={toggleLoginPopup}>
      <div className="popup-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="card p-4 text-center">
          <button className="btn-close" onClick={toggleLoginPopup} style={{ position: "absolute", top: 10, right: 10 }} />
          <h3 className="mb-3">{mode === "login" ? "Đăng nhập" : "Quên mật khẩu"}</h3>

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
      </div>
    </div>
  );
};

export default LoginPopup;
