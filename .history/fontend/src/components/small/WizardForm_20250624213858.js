// 📦 Import các thư viện cần thiết
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";

const WizardForm = () => {
  // 🧠 Quản lý các trạng thái (state)
  const [step, setStep] = useState(1); // Bước hiện tại của form
  const [showPassword, setShowPassword] = useState(false); // Hiện/ẩn mật khẩu
  const [verificationCode, setVerificationCode] = useState(""); // Mã người dùng nhập
  const [sentCode, setSentCode] = useState(""); // Mã đã gửi từ server
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Hiện thông báo thành công
  const [resendCooldown, setResendCooldown] = useState(0); // Đếm ngược gửi lại mã
  const [emailError, setEmailError] = useState(null); // Lỗi nếu email đã dùng

  // 📝 Dữ liệu từ form đăng ký
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

  const navigate = useNavigate(); // Điều hướng sau đăng ký thành công

  // 📧 Kiểm tra định dạng email
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 📥 Cập nhật dữ liệu form khi người dùng nhập
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

  // ✅ Kiểm tra đã điền đầy đủ bước 2
  const isStepTwoComplete = () =>
    formData.personal.fullName.trim() !== "" &&
    formData.personal.phoneNumber.trim() !== "";

  // 👉 Chuyển bước tiếp theo khi hợp lệ
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

  // 🔙 Quay lại bước trước
  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  // 📨 Gửi mã xác thực đến email người dùng
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
        setEmailError(message); // Gắn lỗi dưới bước 3
      }
    } catch (error) {
      console.error("❌ Lỗi gửi email xác thực:", error);
      alert(error.response?.data?.message || "Đã xảy ra lỗi khi gửi email xác thực.");
    }
  };

  // 🧾 Gửi dữ liệu đăng ký sau khi xác thực thành công
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData.account,
      ...formData.personal,
      role: 0, // 👤 Gán quyền mặc định là user
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const fakeCode = "123456"; // Giả lập mã xác thực nếu cần
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

  // 🔁 Gửi lại mã xác thực + đặt lại thời gian chờ
  const handleResendCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(newCode);
    alert(`Mã xác thực mới đã được gửi đến ${formData.account.email}\n(Mã: ${newCode})`);
    setResendCooldown(120);
  };

  // ⏳ Đếm ngược thời gian chờ gửi lại mã
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 📦 Trả ra giao diện JSX (nằm ở phần return phía dưới)
};

export default WizardForm;