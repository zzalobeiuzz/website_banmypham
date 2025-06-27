// 📦 Import các thư viện cần thiết
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useHttp from "../../hooks/useHttp";
import "./style.scss";

const WizardForm = () => {
  const { request } = useHttp();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(120);
  const [emailError, setEmailError] = useState(null);
  const [verificationError, setVerificationError] = useState("");

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
    formData.personal.fullName.trim() !== "" &&
    formData.personal.phoneNumber.trim() !== "";

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
    const payload = { email: formData.account.email };
    try {
      const response = await request(
        "POST",
        "http://localhost:5000/api/user/auth/sendVerificationCode",
        payload
      );
      const { success, message, code } = response;
      if (success) {
        setSentCode(code);
        setStep(4);
      } else {
        setEmailError(message);
      }
    } catch (error) {
      console.error("❌ Lỗi gửi email xác thực:", error);
      alert(
        error.response?.data?.message ||
          "Đã xảy ra lỗi khi gửi email xác thực."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData.account,
      ...formData.personal,
      role: 0,
    };
    try {
      const response = await request(
        "POST",
        "http://localhost:5000/api/user/auth/register",
        payload
      );
      if (response?.success) {
        setShowSuccessMessage(true);
      } else {
        alert(response?.message || "Đăng ký thất bại.");
      }
    } catch (err) {
      console.error("Lỗi gửi đăng ký:", err);
      alert("Đã xảy ra lỗi khi gửi dữ liệu đăng ký.");
    }
  };

  const handleResendCode = async () => {
    await handleSubmitEmail();
    setResendCooldown(120);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  return (
    // (⏩ Không đổi phần render giao diện vì không liên quan đến useHttp)
    <div className="registration-form">{/* ... giao diện như cũ ... */}</div>
  );
};

export default WizardForm;
