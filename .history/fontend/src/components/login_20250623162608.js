import axios from "axios";
import React, { useState } from "react";
import "./auth.scss"; // CSS riêng cho form đăng nhập

const LoginPopup = ({ toggleLoginPopup }) => {
  // State lưu thông tin đăng nhập
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

 
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
       //=============== GỬI FORM ĐĂNG NHẬP ================
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
  
      if (response.status === 200) {
        const displayName = response.data.user.name;
        alert(`🎉 Đăng nhập thành công! Xin chào, ${displayName}!`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Lỗi không xác định";
      alert("❌ Đăng nhập thất bại: " + msg);
      setPassword(""); // ✅ Làm trống input password sau khi báo lỗi
    }
  };
  

  return (
    <div className="popup-overlay" onClick={toggleLoginPopup}>
      <div className="popup-wrapper" onClick={(e) => e.stopPropagation()}>
        <section className="login-section card shadow-2-strong">
          <div className="card-body p-5 text-center">
            {/* Nút đóng */}
            <button
              type="button"
              onClick={toggleLoginPopup}
              className="btn-close"
              aria-label="Close"
              style={{ position: "absolute", top: 10, right: 10 }}
            />

            <h3 className="mb-4">Đăng nhập</h3>

            {/* FORM ĐĂNG NHẬP */}
            <form onSubmit={handleLoginSubmit}>
              {/* EMAIL */}
              <div className="form-outline mb-1">
                <input
                  type="email"
                  id="email"
                  className="form-control form-control-lg"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label className="form-label" htmlFor="email">Email</label>
              </div>

              {/* MẬT KHẨU */}
              <div className="form-outline mb-1">
                <input
                  type="password"
                  id="password"
                  className="form-control form-control-lg"
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label className="form-label" htmlFor="password">Mật khẩu</label>
              </div>

              {/* GHI NHỚ & QUÊN MẬT KHẨU */}
              <div className="form-check d-flex justify-content-between mb-3">
                <div>
                  <input className="form-check-input" type="checkbox" id="rememberMe" />
                  <label className="form-check-label ms-1" htmlFor="rememberMe">
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <div className="d-flex justify-content-end mb-3">
                  <a href="#!" onClick={(e) => e.preventDefault()} className="link-primary text-decoration-none">
                    Quên mật khẩu ?
                  </a>
                </div>
              </div>

              {/* NÚT GỬI FORM */}
              <button type="submit" className="btn btn-primary btn-lg btn-block mb-3 btn-login">
                Đăng nhập
              </button>
              
              {/* CHUYỂN SANG ĐĂNG KÝ */}
              <p className="text-secondary text-center mb-0">
                Bạn chưa có tài khoản?{" "}
                <a href="/signup" className="link-primary text-decoration-none">Đăng kí</a>
              </p>

              <hr className="my-4" />

              {/* ĐĂNG NHẬP GOOGLE */}
              <button className="btn btn-lg btn-block btn-google mb-2" type="button">
                <i className="fab fa-google me-2"></i> Google
              </button>

              {/* ĐĂNG NHẬP FACEBOOK */}
              <button className="btn btn-lg btn-block btn-facebook" type="button">
                <i className="fab fa-facebook-f me-2"></i> Facebook
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPopup;
