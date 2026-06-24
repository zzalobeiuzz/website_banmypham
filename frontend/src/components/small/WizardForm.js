// 📦 Import các thư viện cần thiết
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../constants";
import useHttp from "../../hooks/useHttp";
import FacebookLoginButton from "../login/social/FacebookLoginButton";
import GoogleLoginButton from "../login/social/GoogleLoginButton";
import "./wizardForm.scss";

const WizardForm = () => {
  const { request } = useHttp();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailError, setEmailError] = useState(null);
  const [verificationError, setVerificationError] = useState("");
  const [socialError, setSocialError] = useState("");
  const [socialLoading, setSocialLoading] = useState("");
  const googleClientId = String(process.env.REACT_APP_GOOGLE_CLIENT_ID || "").trim();
  const facebookAppId = String(process.env.REACT_APP_FACEBOOK_APP_ID || "").trim();

  const labelMap = {
    email: "Email",
    displayName: "Tên hiển thị",
    password: "Mật khẩu",
    fullName: "Họ và tên",
    phoneNumber: "Số điện thoại",
    address: "Địa chỉ",
  };

  const [formData, setFormData] = useState({
    account: {
      email: "",
      displayName: "",
      password: "",
    },
    personal: {
      fullName: "",
      phoneNumber: "",
      address: "",
    },
  });

  const navigate = useNavigate();

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (section) => (e) => {
    const { name, value } = e.target;
    if (section === "account" && name === "email") {
      setResendCooldown(0);
      setEmailError(null);
    }
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  };

  const isStepTwoComplete = () =>
    formData.personal.fullName.trim() !== "" && formData.personal.phoneNumber.trim() !== "";

  const handleNext = () => {
    if (step === 1) {
      const { email, displayName, password } = formData.account;
      if (!email.trim() || !displayName.trim() || !password.trim()) {
        alert("Vui lòng nhập đầy đủ thông tin ở bước 1");
        return;
      }
      if (!isValidEmail(email)) {
        alert("Email không hợp lệ");
        setFormData((prev) => ({
          ...prev,
          account: { ...prev.account, email: "" },
        }));
        return;
      }
    }
    if (step === 2 && !isStepTwoComplete()) {
      alert("Vui lòng nhập đầy đủ thông tin ở bước 2");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleSubmitEmail = async () => {
    const payload = { email: formData.account.email, use: "register" };
    setEmailError(null);
    setVerificationCode("");
    setVerificationError("");
    try {
      const response = await request("POST", `${API_BASE}/api/user/auth/sendVerificationCode`, payload);
      const { success, message } = response;
      if (success) {
        setStep(4);
        setResendCooldown(120);
      } else {
        setEmailError(message);
        setStep(3);
      }
    } catch (error) {
      console.error("❌ Lỗi gửi email xác thực:", error);
      alert(error.response?.data?.message || "Đã xảy ra lỗi khi gửi email xác thực.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData.account,
      ...formData.personal,
      verificationCode: String(verificationCode || "").trim(),
      role: 0,
    };
    try {
      const response = await request("POST", `${API_BASE}/api/user/auth/register`, payload);
      if (response?.success) {
        setShowSuccessMessage(true);
      } else {
        alert(response?.message || "Đăng ký thất bại.");
      }
    } catch (err) {
      console.error("Lỗi gửi đăng ký:", err);
      alert(err?.message || "Đã xảy ra lỗi khi gửi dữ liệu đăng ký.");
    }
  };

  const handleResendCode = async () => {
    await handleSubmitEmail();
  };

  const finishSocialAuth = (accessToken, refreshToken, fallbackProfile = null) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("authRemember", "true");
    sessionStorage.setItem("authSessionActive", "true");

    const decoded = jwtDecode(accessToken);
    const mergedUser = {
      ...decoded,
      email:
        decoded?.email ||
        String(fallbackProfile?.email || "").trim().toLowerCase() ||
        "",
      avatar:
        decoded?.avatar ||
        String(fallbackProfile?.picture?.data?.url || "").trim() ||
        null,
    };

    localStorage.setItem("user", JSON.stringify(mergedUser));
    window.location.href = Number(mergedUser.role) === 1 ? "/admin" : "/";
  };

  const handleGoogleRegister = async (code) => {
    try {
      setSocialError("");
      setSocialLoading("google");
      const res = await request("POST", `${API_BASE}/api/user/auth/google-login`, { code });
      if (!res?.accessToken || !res?.refreshToken) {
        throw new Error("Google khong tra ve token hop le.");
      }
      finishSocialAuth(res.accessToken, res.refreshToken);
    } catch (error) {
      setSocialError(error?.message || "Dang ky bang Google that bai.");
    } finally {
      setSocialLoading("");
    }
  };

  const handleFacebookRegister = async (accessToken, facebookProfile = null) => {
    try {
      setSocialError("");
      setSocialLoading("facebook");
      const res = await request("POST", `${API_BASE}/api/user/auth/facebook-login`, {
        accessToken,
        facebookProfile,
      });
      if (!res?.accessToken || !res?.refreshToken) {
        throw new Error("Facebook khong tra ve token hop le.");
      }
      finishSocialAuth(res.accessToken, res.refreshToken, facebookProfile);
    } catch (error) {
      setSocialError(error?.message || "Dang ky bang Facebook that bai.");
    } finally {
      setSocialLoading("");
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  return (
    <div className="registration-form">
      <div className="steps-container">
        <div className="step-line" />
        {[1, 2, 3].map((s) => (
          <div key={s} onClick={() => setStep(s)} style={{ cursor: "pointer" }}>
            <div className={`circle ${step === s ? "active" : "inactive"}`}>{step > s ? "✓" : s}</div>
            Bước {s}
          </div>
        ))}
      </div>

      <div className="step-content">
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
          >
            <h3>Thông tin tài khoản</h3>
            {["email", "displayName", "password"].map((field) =>
              field === "password" ? (
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
                  <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    <img
                      src={
                        showPassword
                          ? `${UPLOAD_BASE}/icons/icons8-eye-48.png`
                          : `${UPLOAD_BASE}/icons/icons8-hide-64.png`
                      }
                      alt="toggle password"
                      loading="lazy"
                    />
                  </span>
                </div>
              ) : (
                <input
                  key={field}
                  className="input-field"
                  type="text"
                  name={field}
                  placeholder={field === "email" ? "Email" : "Tên hiển thị"}
                  value={formData.account[field]}
                  onChange={handleChange("account")}
                  required
                />
              )
            )}

            <button type="submit" className="btn">Tiếp theo</button>

            <div className="sign-up-social">
              <span>Đăng ký với</span>
              <div className="social-buttons">
                <GoogleLoginButton
                  googleClientId={googleClientId}
                  onGoogleCode={handleGoogleRegister}
                  label={socialLoading === "google" ? "Đang xử lý..." : "Google"}
                  compact
                />
                <FacebookLoginButton
                  facebookAppId={facebookAppId}
                  onFacebookAccessToken={handleFacebookRegister}
                  label={socialLoading === "facebook" ? "Đang xử lý..." : "Facebook"}
                  compact
                />
              </div>
              {socialError ? <p className="social-error">{socialError}</p> : null}
              <span className="return-login">
                Bạn đã có tài khoản?{" "}
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

        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
          >
            <h3>Thông tin cá nhân</h3>
            {["fullName", "phoneNumber", "address"].map((field) => (
              <input
                key={field}
                className="input-field"
                type="text"
                name={field}
                placeholder={
                  field === "fullName"
                    ? "Họ và tên"
                    : field === "phoneNumber"
                    ? "Số điện thoại"
                    : "Địa chỉ"
                }
                value={formData.personal[field]}
                onChange={handleChange("personal")}
                required={field !== "address"}
              />
            ))}
            <div className="button-group">
              <button type="button" className="btn" onClick={handleBack}>Quay lại</button>
              <button type="submit" className="btn">Tiếp theo</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitEmail();
            }}
          >
            <h3>Xác nhận thông tin</h3>
            <ul>
              {Object.entries(formData.account).map(([k, v]) => (
                <li key={k}>
                  <strong>{labelMap[k] || k}:</strong> {v}
                </li>
              ))}
              {Object.entries(formData.personal).map(([k, v]) => (
                <li key={k}>
                  <strong>{labelMap[k] || k}:</strong> {v}
                </li>
              ))}
            </ul>
            {emailError && (
              <p className="text-error" style={{ color: "red", marginTop: "10px" }}>❌ {emailError}</p>
            )}
            <div className="button-group">
              <button type="button" className="btn" onClick={handleBack}>Quay lại</button>
              <button type="submit" className="btn">Xác nhận & gửi mã</button>
            </div>
          </form>
        )}

        {step === 4 && (
          <>
            {!showSuccessMessage ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const cleanCode = String(verificationCode || "").trim();
                  if (!/^\d{6}$/.test(cleanCode)) {
                    setVerificationError("Mã xác thực phải gồm đúng 6 chữ số.");
                    return;
                  }
                  handleSubmit(e);
                }}
              >
                <h3>Xác thực Email</h3>
                <p>Mã xác thực đã được gửi đến <strong>{formData.account.email}</strong>.</p>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Nhập mã xác thực"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value);
                    setVerificationError("");
                  }}
                  required
                />
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
                {verificationError && (
                  <p className="text-error" style={{ color: "red", marginTop: "10px" }}>
                    ❌ {verificationError}
                  </p>
                )}
                <div className="button-group">
                  <button type="button" className="btn" onClick={handleBack}>Quay lại</button>
                  <button type="submit" className="btn">Hoàn tất</button>
                </div>
              </form>
            ) : (
              <div className="success-message">
                <p>🎉 Đăng ký thành công!</p>
                <button className="btn ok-btn" onClick={() => navigate("/", { state: { showLogin: true } })}>
                  Đăng nhập ngay
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WizardForm;
