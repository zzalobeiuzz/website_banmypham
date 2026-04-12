import React, { useEffect, useState } from "react";

const FacebookLoginButton = ({ facebookAppId, onFacebookAccessToken }) => {
  // ✅ Chỉ bật đăng nhập khi SDK Facebook đã init thành công.
  const [facebookReady, setFacebookReady] = useState(false);

  useEffect(() => {
    // 📦 Nạp Facebook SDK 1 lần, sau đó init bằng app id để dùng lại nhiều lần.
    if (!facebookAppId) return;

    if (window.FB) {
      window.FB.init({
        appId: facebookAppId,
        cookie: true,
        xfbml: false,
        version: "v20.0",
      });
      setFacebookReady(true);
      return;
    }

    const existing = document.getElementById("facebook-jssdk");
    if (existing) {
      return;
    }

    window.fbAsyncInit = function initFacebookSdk() {
      if (!window.FB) return;
      window.FB.init({
        appId: facebookAppId,
        cookie: true,
        xfbml: false,
        version: "v20.0",
      });
      setFacebookReady(true);
    };

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [facebookAppId]);

  const handleFacebookLogin = () => {
    if (!facebookAppId) {
      window.alert("Thiếu REACT_APP_FACEBOOK_APP_ID ở frontend.");
      return;
    }

    if (!window.FB || !facebookReady) {
      window.alert("Facebook Sign-In chưa sẵn sàng, vui lòng thử lại.");
      return;
    }

    // 🔐 Frontend chỉ lấy access token + profile tối thiểu.
    // Backend mới là nơi verify token và lấy profile chính xác từ Graph API.
    window.FB.login(
      (response) => {
        const accessToken = response?.authResponse?.accessToken;
        const fbUserId = String(response?.authResponse?.userID || "").trim();
        const grantedScopes = String(response?.authResponse?.grantedScopes || "").toLowerCase();

        // ⚠️ Bắt buộc có quyền email theo yêu cầu business hiện tại.
        if (accessToken && grantedScopes && !grantedScopes.includes("email")) {
          window.alert("Facebook chưa cấp quyền email cho ứng dụng này. Vui lòng bấm Continue và chọn cấp quyền email.");
          return;
        }

        if (accessToken) {
          // 🧩 safeProfile là dữ liệu fallback cho UI; server vẫn là nguồn dữ liệu chính.
          const safeProfile = {
            id: fbUserId,
            picture: {
              data: {
                url: fbUserId
                  ? `https://graph.facebook.com/${fbUserId}/picture?type=large`
                  : "",
              },
            },
          };

          onFacebookAccessToken(accessToken, safeProfile);
          return;
        }
        window.alert("Không lấy được access token từ Facebook.");
      },
      {
        scope: "public_profile,email",
        auth_type: "rerequest",
        return_scopes: true,
      }
    );
  };

  return (
    <button
      type="button"
      className="btn btn-outline-primary"
      onClick={handleFacebookLogin}
    >
      <i className="fab fa-facebook-f me-2"></i> Đăng nhập bằng Facebook
    </button>
  );
};

export default FacebookLoginButton;