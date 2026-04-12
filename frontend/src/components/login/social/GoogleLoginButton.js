import React, { useEffect, useState } from "react";

const GoogleLoginButton = ({ googleClientId, onGoogleCode }) => {
  // ✅ Chỉ bật nút đăng nhập khi SDK Google đã sẵn sàng.
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    // 📦 Nạp Google Identity script đúng 1 lần để tái sử dụng cho các lần mở popup sau.
    if (!googleClientId) return;

    const existing = document.getElementById("google-identity-script");
    if (existing) {
      setGoogleReady(Boolean(window.google?.accounts?.id));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    document.body.appendChild(script);
  }, [googleClientId]);

  const handleGoogleLogin = () => {
    if (!googleClientId) {
      window.alert("Thiếu REACT_APP_GOOGLE_CLIENT_ID ở frontend.");
      return;
    }

    if (!window.google?.accounts?.oauth2 || !googleReady) {
      window.alert("Google Sign-In chưa sẵn sàng, vui lòng thử lại.");
      return;
    }

    // 🔐 Luồng bảo mật: frontend chỉ xin authorization code,
    // backend mới là nơi đổi/verify và phát JWT nội bộ.
    const codeClient = window.google.accounts.oauth2.initCodeClient({
      client_id: googleClientId,
      scope: "openid email profile",
      ux_mode: "popup",
      redirect_uri: "postmessage",
      callback: (response) => {
        // 📬 Chỉ xử lý khi Google trả về code hợp lệ.
        if (response?.code) {
          onGoogleCode(response.code);
        }
      },
    });

    codeClient.requestCode();
  };

  return (
    <button
      type="button"
      className="btn btn-outline-danger mb-2"
      onClick={handleGoogleLogin}
    >
      <i className="fab fa-google me-2"></i> Đăng nhập bằng Google
    </button>
  );
};

export default GoogleLoginButton;