import React from 'react';
import './auth.scss'; // Đảm bảo file CSS đã được tạo đúng

function LoginPopup({ toggleLoginPopup, handleLoginSubmit }) {
  return (
    <div className="popup-overlay" onClick={toggleLoginPopup}>
      <div className="popup-wrapper" onClick={(e) => e.stopPropagation()}>
        <section className="login-section card shadow-2-strong">
          <div className="card-body p-5 text-center">

            {/* Nút đóng popup */}
            <button
              type="button"
              onClick={toggleLoginPopup}
              className="btn-close"
              aria-label="Close"
              style={{ position: 'absolute', top: 10, right: 10 }}
            />

            <h3 className="mb-4">Đăng nhập</h3>

            <form onSubmit={handleLoginSubmit}>
              <div className="form-outline mb-1">
                <input
                  type="email"
                  id="email"
                  className="form-control form-control-lg"
                  placeholder="Email"
                  required
                />
                <label className="form-label" htmlFor="email">Email</label>
              </div>

              <div className="form-outline mb-1">
                <input
                  type="password"
                  id="password"
                  className="form-control form-control-lg"
                  placeholder="Mật khẩu"
                  required
                />
                <label className="form-label" htmlFor="password">Mật khẩu</label>
              </div>

              <div className="form-check d-flex justify-content-between mb-3">
              <div>
                <input className="form-check-input" type="checkbox" id="rememberMe" />
                <label className="form-check-label ms-1" htmlFor="rememberMe">
                  Ghi nhớ đăng nhập
                </label>
                </div>
                <div className="d-flex justify-content-end mb-3">
              <a href="#!" onClick={(e) => e.preventDefault()} className="link-primary text-decoration-none">
              Quên mật khẩu ?</a>
              </div>
                
              </div>

              

              <button type="submit" className="btn btn-primary btn-lg btn-block mb-3 btn-login">
                Đăng nhập
              </button>

              <p className="text-secondary text-center mb-0">
                Bạn chưa có tài khoản?    {' '}
                <a href="/signup" className="link-primary text-decoration-none">
                  Đăng kí
                </a>
              </p>

              <hr className="my-4" />

              <button className="btn btn-lg btn-block btn-google mb-2" type="button">
                <i className="fab fa-google me-2"></i> Google
              </button>

              <button className="btn btn-lg btn-block btn-facebook" type="button">
                <i className="fab fa-facebook-f me-2"></i> Facebook
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LoginPopup;
