// 📦 Import các thư viện cần thiết
import React from "react";
import "./style.scss";

const WizardForm = () => {
  // ... [các phần đã comment trước đó giữ nguyên] ...

  return (
    // 🧾 Giao diện chính của form đăng ký nhiều bước
    <div className="registration-form">

      {/* 🔢 Header các bước đăng ký (Step indicator) */}
      <div className="steps-container">
        <div className="step-line" />
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            onClick={() => setStep(s)}
            style={{ cursor: "pointer" }}
          >
            <div className={`circle ${step === s ? "active" : "inactive"}`}>
              {step > s ? "✓" : s} {/* ✅ Hiện dấu tick nếu đã hoàn thành */}
            </div>
            Bước {s}
          </div>
        ))}
      </div>

      {/* 📦 Nội dung tương ứng theo từng bước */}
      <div className="step-content">

        {/* 🧾 Bước 1: Thông tin tài khoản */}
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
          >
            <h3>Thông tin tài khoản</h3>
            {/* 🔐 Các trường nhập: email, tên hiển thị, mật khẩu */}
            {['email', 'displayName', 'password'].map((field) =>
              field === 'password' ? (
                <div key={field} className="password-input-wrapper">
                  <input
                    className="input-field password-input"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Mật khẩu"
                    value={formData.account.password}
                    onChange={handleChange("account")}
                    required
                  />
                  {/* 👁️ Toggle hiển thị mật khẩu */}
                  <span
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <img
                      src={showPassword ? "./assets/icons/icons8-eye-48.png" : "./assets/icons/icons8-hide-64.png"}
                      alt="toggle password"
                    />
                  </span>
                </div>
              ) : (
                <input
                  key={field}
                  className="input-field"
                  type="text"
                  name={field}
                  placeholder={field === 'email' ? 'Email' : 'Tên hiển thị'}
                  value={formData.account[field]}
                  onChange={handleChange("account")}
                  required
                />
              )
            )}

            <button type="submit" className="btn">Tiếp theo</button>

            {/* 🌐 Đăng ký với mạng xã hội */}
            <div className="sign-up-social">
              <span>Đăng ký với</span>
              <div className="social-buttons">
                {['google', 'facebook'].map((name) => (
                  <button key={name} className={`social ${name}`} type="button">
                    <img src={`./assets/icons/icons8-${name}-24.png`} alt={name} />
                  </button>
                ))}
              </div>

              {/* 🔁 Chuyển về đăng nhập nếu đã có tài khoản */}
              <span className="return-login">
                Bạn đã có tài khoản?{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate("/", { state: { showLogin: true } })}
                >
                  Đăng nhập
                </button>
              </span>
            </div>
          </form>
        )}

        {/* 🧍‍♂️ Bước 2: Thông tin cá nhân */}
        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
          >
            <h3>Thông tin cá nhân</h3>
            {['fullName', 'phoneNumber', 'address'].map((field) => (
              <input
                key={field}
                className="input-field"
                type="text"
                name={field}
                placeholder={field === 'fullName' ? 'Họ và tên' : field === 'phoneNumber' ? 'Số điện thoại' : 'Địa chỉ'}
                value={formData.personal[field]}
                onChange={handleChange("personal")}
                required={field !== 'address'}
              />
            ))}
            <div className="button-group">
              <button type="button" className="btn" onClick={handleBack}>Quay lại</button>
              <button type="submit" className="btn">Tiếp theo</button>
            </div>
          </form>
        )}

        {/* 🔍 Bước 3: Xác nhận thông tin trước khi gửi email */}
        {step === 3 && (
          <form onSubmit={handleSubmitEmail}>
            <h3>Xác nhận thông tin</h3>
            <ul>
              {Object.entries(formData.account).map(([k, v]) => (
                <li key={k}><strong>{k}:</strong> {v}</li>
              ))}
              {Object.entries(formData.personal).map(([k, v]) => (
                <li key={k}><strong>{k}:</strong> {v}</li>
              ))}
            </ul>
            {/* ⚠️ Hiển thị lỗi nếu email đã tồn tại */}
            {emailError && (
              <p className="text-error" style={{ color: "red", marginTop: "10px" }}>
                ❌ {emailError}
              </p>
            )}
            <div className="button-group">
              <button type="button" className="btn" onClick={handleBack}>Quay lại</button>
              <button type="submit" className="btn">Xác nhận</button>
            </div>
          </form>
        )}

        {/* 📧 Bước 4: Nhập mã xác thực đã gửi về email */}
        {step === 4 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (verificationCode === sentCode) {
                setShowSuccessMessage(true);
                handleSubmit(); // ✅ Gửi dữ liệu đăng ký
              } else {
                alert("Mã xác thực không đúng. Vui lòng kiểm tra lại email.");
              }
            }}
          >
            <h3>Xác thực Email</h3>
            <p>
              Mã xác thực đã được gửi đến{' '}
              <strong>{formData.account.email}</strong>.
            </p>

            <input
              className="input-field"
              type="text"
              placeholder="Nhập mã xác thực"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />

            {/* 🔁 Gửi lại mã nếu người dùng chưa nhận */}
            <div className="resend-code">
              <button
                type="button"
                className="link-button resend-btn"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : "Gửi lại mã"}
              </button>
            </div>

            {/* 🎯 Nút hoàn tất đăng ký hoặc hiển thị thành công */}
            <div className="button-group">
              {!showSuccessMessage ? (
                <>
                  <button type="button" className="btn" onClick={handleBack}>Quay lại</button>
                  <button type="submit" className="btn">Hoàn tất</button>
                </>
              ) : (
                <div className="success-message">
                  <p>🎉 Đăng ký thành công!</p>
                  <button className="btn ok-btn" onClick={() => navigate("/", { state: { showLogin: true } })}>
                    Đăng nhập ngay
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default WizardForm;
