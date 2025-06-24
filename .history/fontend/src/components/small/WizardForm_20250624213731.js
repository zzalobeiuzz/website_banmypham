// 📦 Import các thư viện cần thiết
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";

const WizardForm = () => {
  // 🧠 State quản lý bước form
  const [step, setStep] = useState(1);

  // 👁️ Quản lý hiện/ẩn mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  // 🔑 Quản lý mã xác thực người dùng nhập và mã được gửi
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");

  // 🎉 Trạng thái hiển thị thông báo thành công sau xác thực
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ⏳ Thời gian chờ gửi lại mã xác thực (giây)
  const [resendCooldown, setResendCooldown] = useState(0);

  // ❌ Lưu lỗi email (ví dụ email đã được đăng ký)
  const [emailError, setEmailError] = useState(null);

  // 📝 Dữ liệu form gồm tài khoản & thông tin cá nhân
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

  // 🔀 Chuyển hướng điều hướng React Router
  const navigate = useNavigate();

  // 📧 Kiểm tra định dạng email
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 📝 Hàm thay đổi giá trị input cho form (theo từng section)
  const handleChange = (section) => (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  };

  // ✅ Kiểm tra Bước 2 đã nhập đủ thông tin chưa
  const isStepTwoComplete = () =>
    formData.personal.fullName.trim() !== "" &&
    formData.personal.phoneNumber.trim() !== "";

  // 👉 Xử lý khi nhấn nút “Tiếp theo”
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

  // 🔙 Quay lại bước trước đó
  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  // 📨 Gửi email xác thực – kiểm tra email trùng
  const handleSubmitEmail = async (e) => {
    e.preventDefault();

    const payload = { email: formData.account.email };

    try {
      const response = await axios.post("http://localhost:5000/api/auth/sendVerificationCode", payload);
      const { success, message, code } = response.data;

      if (success) {
        alert("✅ Mã xác thực đã được gửi về email của bạn.");
        setSentCode(code);
        setStep(4);
      } else {
        setEmailError(message); // hiện thông báo lỗi dưới bước 3
      }
    } catch (error) {
      console.error("❌ Lỗi gửi email xác thực:", error);
      alert(error.response?.data?.message || "Đã xảy ra lỗi khi gửi email xác thực.");
    }
  };

  // 🧾 Gửi dữ liệu đăng ký tài khoản (sau khi xác thực thành công)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData.account,
      ...formData.personal,
      role: 0, // 👤 role mặc định: user
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const fakeCode = "123456"; // giả lập mã xác thực nếu không dùng nodemailer
        setSentCode(fakeCode);
        setStep(4);
      } else {
        const data = await response.json();
        alert(data.message || "Đăng ký thất bại.");
      }
    } catch (err) {
      console.error("Lỗi gửi đăng ký:", err);
      alert("Đã xảy ra lỗi khi gửi dữ liệu đăng ký.");
    }
  };

  // 🔁 Gửi lại mã xác thực và reset thời gian chờ
  const handleResendCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(newCode);
    alert(`Mã xác thực mới đã được gửi đến ${formData.account.email}\n(Mã: ${newCode})`);
    setResendCooldown(120);
  };

  // 🕒 Đếm ngược thời gian cooldown gửi lại mã
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);
