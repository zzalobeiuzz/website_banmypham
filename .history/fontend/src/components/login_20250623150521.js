import React, { useState } from "react";
import "./auth.scss"; // CSS riêng cho form đăng nhập
import axios from "axios";

//=============== POST DỮ LIỆU ==============
const handleLoginSubmit = async (e) => {
  e.preventDefault(); // Ngăn reload trang mặc định

  try {
    const response = await axios.post("http://localhost:3000/api/auth/login", {
      email,
      password,
    });

    if (response.status === 200) {
      alert("🎉 Đăng nhập thành công!");
      // Ví dụ: lưu token vào localStorage nếu có
      // localStorage.setItem("token", response.data.token);
    }
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err.response?.data || err.message);
    alert("❌ Đăng nhập thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
  }
};
const LoginPopup = ({ toggleLoginPopup, handleLoginSubmit }) => {
  //Khai báo biến
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    // Lớp phủ mờ nền, bấm vào để đóng popup
    <div className="popup-overlay" onClick={toggleLoginPopup}>
      {/* Nội dung popup, ngăn sự kiện đóng khi click bên trong */}
      <div className="popup-wrapper" onClick={(e) => e.stopPropagation()}>
        <section className="login-section card shadow-2-strong">
          <div className="card-body p-5 text-center">
            {/* Nút đóng popup */}
            <button
              type="button"
              onClick={toggleLoginPopup}
              className="btn-close"
              aria-label="Close"
              style={{ position: "absolute", top: 10, right: 10 }}
            />

            <h3 className="mb-4">Đăng nhập</h3>

            {/* Form đăng nhập chính */}
            <form onSubmit={handleLoginSubmit}>
              {/* Trường nhập Email */}
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
                <label className="form-label" htmlFor="email">
                  Email
                </label>
              </div>

              {/* Trường nhập Mật khẩu */}
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
                <label className="form-label" htmlFor="password">
                  Mật khẩu
                </label>
              </div>

              {/* Ghi nhớ đăng nhập + quên mật khẩu */}
              <div className="form-check d-flex justify-content-between mb-3">
                <div>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                  />
                  <label className="form-check-label ms-1" htmlFor="rememberMe">
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <div className="d-flex justify-content-end mb-3">
                  <a
                    href="#!"
                    onClick={(e) => e.preventDefault()}
                    className="link-primary text-decoration-none"
                  >
                    Quên mật khẩu ?
                  </a>
                </div>
              </div>

              {/* Nút gửi form đăng nhập */}
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block mb-3 btn-login"
              >
                Đăng nhập
              </button>

              {/* Link chuyển sang trang đăng ký */}
              <p className="text-secondary text-center mb-0">
                Bạn chưa có tài khoản?{" "}
                <a href="/signup" className="link-primary text-decoration-none">
                  Đăng kí
                </a>
              </p>

              <hr className="my-4" />

              {/* Đăng nhập bằng Google */}
              <button
                className="btn btn-lg btn-block btn-google mb-2"
                type="button"
              >
                <i className="fab fa-google me-2"></i> Google
              </button>

              {/* Đăng nhập bằng Facebook */}
              <button
                className="btn btn-lg btn-block btn-facebook"
                type="button"
              >
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
