import { memo, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import { ROUTERS } from "../../../utils/router";
import "./profile_page.scss";

const getInitials = (fullName = "") => {
  const parts = String(fullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const resolveAvatarSrc = (avatar) => {
  if (!avatar) return "";
  if (/^https?:\/\//i.test(avatar) || avatar.startsWith("data:")) return avatar;
  return `${UPLOAD_BASE}/${String(avatar).replace(/^\/+/, "")}`;
};

const isErrorText = (message = "") => {
  const value = String(message || "").toLowerCase();
  if (!value) return false;

  return [
    "thất bại",
    "lỗi",
    "hết hạn",
    "không",
    "trống",
    "khớp",
    "sai",
    "không thể",
    "tồn tại",
    "hợp lệ",
    "thiếu",
    "vui lòng",
  ].some((keyword) => value.includes(keyword));
};

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [nameMessage, setNameMessage] = useState("");
  const [fieldMessage, setFieldMessage] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState("");
  const [editPhoneValue, setEditPhoneValue] = useState("");
  const [editAddressValue, setEditAddressValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successPopupMessage, setSuccessPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorPopupMessage, setErrorPopupMessage] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const emailEditableRef = useRef(null);
  const phoneEditableRef = useRef(null);
  const addressEditableRef = useRef(null);
  const navigate = useNavigate();
  const { request, loading } = useHttp();

  const showErrorMessage = (setter, message) => {
    const text = String(message || "Có lỗi xảy ra.");
    setter(text);
    setErrorPopupMessage(text);
    setShowErrorPopup(true);
  };

  const showSuccessMessage = (setter, message) => {
    const text = String(message || "Thao tác thành công.");
    setter(text);
    setShowErrorPopup(false);
    setErrorPopupMessage("");
    setSuccessPopupMessage(text);
    setShowSuccessPopup(true);
  };

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    setSuccessPopupMessage("");
  };

  const resetProfileFieldsToOriginal = () => {
    const baseEmail = user?.email || "Chưa cập nhật";
    const basePhone = user?.phoneNumber || user?.phone || "Chưa cập nhật";
    const baseAddress = user?.address || "Chưa cập nhật";

    setEditEmailValue(baseEmail);
    setEditPhoneValue(basePhone);
    setEditAddressValue(baseAddress);

    if (emailEditableRef.current) emailEditableRef.current.textContent = baseEmail;
    if (phoneEditableRef.current) phoneEditableRef.current.textContent = basePhone;
    if (addressEditableRef.current) addressEditableRef.current.textContent = baseAddress;
  };

  const closeErrorPopup = () => {
    setShowErrorPopup(false);
    setErrorPopupMessage("");
    if (isEditingFields) {
      resetProfileFieldsToOriginal();
      setIsEditingFields(false);
    }
    setAvatarMessage((prev) => (isErrorText(prev) ? "" : prev));
    setNameMessage((prev) => (isErrorText(prev) ? "" : prev));
    setFieldMessage((prev) => (isErrorText(prev) ? "" : prev));
    setPasswordMessage((prev) => (isErrorText(prev) ? "" : prev));
  };

  const placeCaretAtEnd = (element) => {
    if (!element) return;
    element.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  useEffect(() => {
    const hydrateLocalUser = () => {
      const saved = localStorage.getItem("user");
      if (!saved) {
        setUser(null);
        return null;
      }

      try {
        const userData = JSON.parse(saved);
        setUser(userData);
        setEditNameValue(userData.profileName || userData.name || "Người dùng");
        setEditEmailValue(userData.email || "");
        setEditPhoneValue(userData.phoneNumber || userData.phone || "");
        setEditAddressValue(userData.address || "");
        return userData;
      } catch (error) {
        console.error("Không thể đọc thông tin người dùng từ localStorage", error);
        setUser(null);
        return null;
      }
    };

    const fetchLatestProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const response = await request("GET", `${API_BASE}/api/user/auth/profile`, null, {
          Authorization: `Bearer ${token}`,
        });

        if (response?.success && response?.data) {
          const updatedUser = {
            ...(JSON.parse(localStorage.getItem("user") || "{}") || {}),
            email: response.data.email,
            name: response.data.displayName || "",
            profileName: response.data.name || response.data.displayName || "",
            phoneNumber: response.data.phoneNumber || "",
            address: response.data.address || "",
            avatar: response.data.avatar || null,
            role: response.data.role,
          };

          setUser(updatedUser);
          setEditNameValue(updatedUser.profileName || "Người dùng");
          setEditEmailValue(updatedUser.email || "");
          setEditPhoneValue(updatedUser.phoneNumber || "");
          setEditAddressValue(updatedUser.address || "");
          localStorage.setItem("user", JSON.stringify(updatedUser));
          window.dispatchEvent(new Event("user-updated"));
        }
      } catch (error) {
        // Bỏ qua lỗi fetch profile để không chặn màn hình
      }
    };

    const initProfileData = async () => {
      try {
        const localUser = hydrateLocalUser();
        if (localUser) {
          await fetchLatestProfile();
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    initProfileData();
  }, [request]);

  useEffect(() => {
    if (isEditingFields) {
      placeCaretAtEnd(emailEditableRef.current);
    }
  }, [isEditingFields]);

  useEffect(() => {
    const messages = [avatarMessage, nameMessage, fieldMessage, passwordMessage].filter(Boolean);
    const latestError = messages.find((message) => isErrorText(message));

    if (latestError && latestError !== errorPopupMessage) {
      setErrorPopupMessage(latestError);
      setShowErrorPopup(true);
    }
  }, [avatarMessage, nameMessage, fieldMessage, passwordMessage, errorPopupMessage]);

  const displayName = user?.profileName || user?.name || "Người dùng";
  const displayEmail = user?.email || "Chưa cập nhật";
  const displayPhone = user?.phoneNumber || user?.phone || "Chưa cập nhật";
  const displayAddress = user?.address || "Chưa cập nhật";

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("Phiên đăng nhập đã hết hạn.");
    }

    const refreshRes = await request("POST", `${API_BASE}/api/admin/refresh-token`, {
      refreshToken,
    });

    if (!refreshRes?.accessToken) {
      throw new Error("Không thể làm mới access token.");
    }

    localStorage.setItem("accessToken", refreshRes.accessToken);
    return refreshRes.accessToken;
  };

  const updateLocalUserAvatar = (avatar) => {
    setUser((prev) => ({ ...(prev || {}), avatar }));
    const saved = localStorage.getItem("user");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      parsed.avatar = avatar;
      localStorage.setItem("user", JSON.stringify(parsed));
      window.dispatchEvent(new Event("user-updated"));
    } catch (error) {
      console.error("Không thể cập nhật localStorage user avatar", error);
    }
  };

  const uploadAvatar = async ({ file }) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      showErrorMessage(setAvatarMessage, "Phiên đăng nhập đã hết hạn.");
      return;
    }

    setAvatarMessage("");
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await request("PUT", `${API_BASE}/api/user/auth/avatar`, formData, {
        Authorization: `Bearer ${token}`,
      });

      if (response?.avatar) {
        updateLocalUserAvatar(response.avatar);
        showSuccessMessage(setAvatarMessage, "Cập nhật ảnh đại diện thành công.");
      }
    } catch (error) {
      const isAuthError = error?.status === 401;
      if (!isAuthError) {
        showErrorMessage(setAvatarMessage, error?.message || "Cập nhật ảnh đại diện thất bại.");
        return;
      }

      try {
        const newAccessToken = await refreshAccessToken();
        const retryFormData = new FormData();
        retryFormData.append("avatar", file);

        const retryRes = await request("PUT", `${API_BASE}/api/user/auth/avatar`, retryFormData, {
          Authorization: `Bearer ${newAccessToken}`,
        });

        if (retryRes?.avatar) {
          updateLocalUserAvatar(retryRes.avatar);
          showSuccessMessage(setAvatarMessage, "Cập nhật ảnh đại diện thành công.");
          return;
        }

        showErrorMessage(setAvatarMessage, "Không nhận được dữ liệu ảnh đại diện mới.");
      } catch (refreshError) {
        showErrorMessage(setAvatarMessage, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showErrorMessage(setPasswordMessage, "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (newPassword.length < 6) {
      showErrorMessage(setPasswordMessage, "Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorMessage(setPasswordMessage, "Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      showErrorMessage(setPasswordMessage, "Phiên đăng nhập đã hết hạn.");
      return;
    }

    setPasswordMessage("");

    const submitRequest = async (authToken) => {
      return request(
        "PUT",
        `${API_BASE}/api/user/auth/change-password`,
        { currentPassword, newPassword },
        { Authorization: `Bearer ${authToken}` }
      );
    };

    try {
      const response = await submitRequest(token);
      if (response?.success) {
        showSuccessMessage(setPasswordMessage, "Đổi mật khẩu thành công.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        return;
      }

      setPasswordMessage(response?.message || "Đổi mật khẩu thất bại.");
    } catch (error) {
      if (error?.status !== 401) {
        showErrorMessage(setPasswordMessage, error?.message || "Đổi mật khẩu thất bại.");
        return;
      }

      try {
        const newAccessToken = await refreshAccessToken();
        const retryResponse = await submitRequest(newAccessToken);

        if (retryResponse?.success) {
          showSuccessMessage(setPasswordMessage, "Đổi mật khẩu thành công.");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setShowCurrentPassword(false);
          setShowNewPassword(false);
          setShowConfirmPassword(false);
          return;
        }

        showErrorMessage(setPasswordMessage, retryResponse?.message || "Đổi mật khẩu thất bại.");
      } catch (refreshError) {
        showErrorMessage(setPasswordMessage, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
      }
    }
  };

  const handleChooseFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        uploadAvatar({ file });
      }
    };

    input.click();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate(`/${ROUTERS.USER.HOME}`);
    window.location.reload();
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!editNameValue.trim()) {
      showErrorMessage(setNameMessage, "Tên không được trống.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      showErrorMessage(setNameMessage, "Phiên đăng nhập đã hết hạn.");
      return;
    }

    try {
      setNameMessage("");

      const submitRequest = async (accessToken) => {
        return await request(
          "PUT",
          `${API_BASE}/api/user/auth/update-profile`,
          { name: editNameValue.trim() },
          { Authorization: `Bearer ${accessToken}` }
        );
      };

      const response = await submitRequest(token);
      if (response?.success) {
        setUser((prev) => ({ ...(prev || {}), profileName: editNameValue.trim() }));
        const saved = localStorage.getItem("user");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            parsed.profileName = editNameValue.trim();
            localStorage.setItem("user", JSON.stringify(parsed));
            window.dispatchEvent(new Event("user-updated"));
          } catch (e) {
            console.error("Không thể cập nhật localStorage user name", e);
          }
        }
        setEditingName(false);
        showSuccessMessage(setNameMessage, "Cập nhật tên thành công.");
        return;
      }

      showErrorMessage(setNameMessage, response?.message || "Cập nhật tên thất bại.");
    } catch (error) {
      if (error?.status !== 401) {
        showErrorMessage(setNameMessage, error?.message || "Cập nhật tên thất bại.");
        return;
      }

      try {
        const newAccessToken = await refreshAccessToken();
        const retryResponse = await request(
          "PUT",
          `${API_BASE}/api/user/auth/update-profile`,
          { name: editNameValue.trim() },
          { Authorization: `Bearer ${newAccessToken}` }
        );

        if (retryResponse?.success) {
          setUser((prev) => ({ ...(prev || {}), profileName: editNameValue.trim() }));
          const saved = localStorage.getItem("user");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              parsed.profileName = editNameValue.trim();
              localStorage.setItem("user", JSON.stringify(parsed));
              window.dispatchEvent(new Event("user-updated"));
            } catch (e) {
              console.error("Không thể cập nhật localStorage user name", e);
            }
          }
          setEditingName(false);
          showSuccessMessage(setNameMessage, "Cập nhật tên thành công.");
          return;
        }

        showErrorMessage(setNameMessage, retryResponse?.message || "Cập nhật tên thất bại.");
      } catch (refreshError) {
        showErrorMessage(setNameMessage, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
      }
    }
  };

  const handleSaveProfileFields = async () => {
    const nextEmail = (emailEditableRef.current?.textContent || "").trim();
    const nextPhone = (phoneEditableRef.current?.textContent || "").trim();
    const nextAddress = (addressEditableRef.current?.textContent || "").trim();

    if (!nextEmail || !nextPhone || !nextAddress) {
      showErrorMessage(setFieldMessage, "Vui lòng điền đầy đủ thông tin.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      showErrorMessage(setFieldMessage, "Phiên đăng nhập đã hết hạn.");
      return;
    }

    try {
      setFieldMessage("");

      const payload = {
        email: nextEmail,
        phoneNumber: nextPhone,
        address: nextAddress,
      };

      const submitRequest = async (accessToken) => {
        return await request(
          "PUT",
          `${API_BASE}/api/user/auth/update-profile`,
          payload,
          { Authorization: `Bearer ${accessToken}` }
        );
      };

      let response;
      try {
        response = await submitRequest(token);
      } catch (error) {
        if (error?.status !== 401) throw error;
        const newAccessToken = await refreshAccessToken();
        response = await submitRequest(newAccessToken);
      }

      if (!response?.success) {
        showErrorMessage(setFieldMessage, response?.message || "Cập nhật thông tin thất bại.");
        return;
      }

      const updatedUser = {
        ...(user || {}),
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        address: payload.address,
      };

      setUser(updatedUser);
      setEditEmailValue(payload.email);
      setEditPhoneValue(payload.phoneNumber);
      setEditAddressValue(payload.address);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("user-updated"));
      setIsEditingFields(false);
      showSuccessMessage(setFieldMessage, "Cập nhật thông tin thành công.");

      if (response?.requiresReLogin) {
        setTimeout(() => {
          alert("Bạn vừa đổi email đăng nhập. Vui lòng đăng nhập lại.");
          handleLogout();
        }, 300);
      }
    } catch (error) {
      showErrorMessage(setFieldMessage, error?.message || "Lỗi khi cập nhật.");
    }
  };

  if (isInitialLoading) {
    return (
      <section className="profile-page">
        <div className="profile-card profile-loading-card" aria-busy="true" aria-live="polite">
          <div className="profile-loading-header" />
          <div className="profile-loading-body">
            <div className="profile-loading-left">
              <div className="profile-loading-avatar" />
              <div className="profile-loading-line name" />
            </div>
            <div className="profile-loading-right">
              <div className="profile-loading-line" />
              <div className="profile-loading-line" />
              <div className="profile-loading-line" />
            </div>
          </div>
          <div className="profile-loading-spinner" />
          <p className="profile-loading-text">Đang tải thông tin tài khoản...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <div className="profile-card">
        <div className="profile-page-title">
          <h1>Thông tin tài khoản</h1>
        </div>

        <div className="profile-head">
          <div className="profile-left-column">
            <button
              type="button"
              className="profile-avatar-btn"
              onClick={handleChooseFile}
              title="Bấm để đổi ảnh đại diện từ máy"
              disabled={loading}
            >
              {user?.avatar ? (
                <img src={resolveAvatarSrc(user.avatar)} alt="avatar" className="profile-avatar-image" />
              ) : (
                <div className="profile-avatar">{getInitials(displayName)}</div>
              )}
            </button>

            <div className="profile-user-section">
              {!editingName ? (
                <div className="name-display">
                  <h2 className="profile-user-name">{displayName}</h2>
                  <button
                    type="button"
                    className="edit-name-btn"
                    onClick={() => {
                      setEditingName(true);
                      setNameMessage("");
                    }}
                    title="Sửa tên"
                  >
                    ✎
                  </button>
                </div>
              ) : (
                <form className="name-edit-form" onSubmit={handleUpdateName}>
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    autoFocus
                  />
                  <div className="name-edit-buttons">
                    <button type="submit" className="btn-save" disabled={loading}>
                      Lưu
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        setEditingName(false);
                        setEditNameValue(displayName);
                        setNameMessage("");
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
              {nameMessage && (
                <div className={`name-message ${isErrorText(nameMessage) ? "message-error" : "message-success"}`}>
                  {nameMessage}
                </div>
              )}
            </div>
          </div>

          <div className="profile-right-column">
            {avatarMessage && (
              <div className={`avatar-message ${isErrorText(avatarMessage) ? "message-error" : "message-success"}`}>
                {avatarMessage}
              </div>
            )}

            {user && (
              <>
                <div className="profile-grid-header">
                  {!isEditingFields ? (
                    <button
                      type="button"
                      className="btn-edit-fields"
                      onClick={() => setIsEditingFields(true)}
                    >
                      Chỉnh sửa
                    </button>
                  ) : (
                    <div className="profile-grid-actions">
                      <button
                        type="button"
                        className="btn-edit-fields save"
                        onClick={handleSaveProfileFields}
                        disabled={loading}
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        className="btn-edit-fields cancel"
                        onClick={() => {
                          resetProfileFieldsToOriginal();
                          setIsEditingFields(false);
                          setFieldMessage("");
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>

                <div className="profile-grid">
                  <div className="profile-item">
                    <span>Email</span>
                    <strong
                      ref={emailEditableRef}
                      className={`editable-strong ${isEditingFields ? "is-editing" : ""}`}
                      contentEditable={isEditingFields}
                      suppressContentEditableWarning
                    >
                      {isEditingFields ? editEmailValue : displayEmail}
                    </strong>
                  </div>

                  <div className="profile-item">
                    <span>Số điện thoại</span>
                    <strong
                      ref={phoneEditableRef}
                      className={`editable-strong ${isEditingFields ? "is-editing" : ""}`}
                      contentEditable={isEditingFields}
                      suppressContentEditableWarning
                    >
                      {isEditingFields ? editPhoneValue : displayPhone}
                    </strong>
                  </div>

                  <div className="profile-item">
                    <span>Địa chỉ</span>
                    <strong
                      ref={addressEditableRef}
                      className={`editable-strong ${isEditingFields ? "is-editing" : ""}`}
                      contentEditable={isEditingFields}
                      suppressContentEditableWarning
                    >
                      {isEditingFields ? editAddressValue : displayAddress}
                    </strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {user ? (
          <>
            <div className="profile-actions">
              <Link to={`/${ROUTERS.USER.HOME}`} className="btn-secondary">
                Về trang chủ
              </Link>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowChangePassword((prev) => !prev)}
              >
                {showChangePassword ? "Ẩn đổi mật khẩu" : "Đổi mật khẩu"}
              </button>
              <button type="button" className="btn-danger" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>

            {showChangePassword && (
              <form className="change-password-box" onSubmit={handleChangePassword}>
                <h3>Đổi mật khẩu</h3>

                <div className="change-password-field">
                  <label>Mật khẩu hiện tại</label>
                  <div className="password-input-wrap">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                    >
                      {showCurrentPassword ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </div>

                <div className="change-password-field">
                  <label>Mật khẩu mới</label>
                  <div className="password-input-wrap">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                    >
                      {showNewPassword ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </div>

                <div className="change-password-field">
                  <label>Xác nhận mật khẩu mới</label>
                  <div className="password-input-wrap">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </div>

                {passwordMessage && (
                  <div className={`password-message ${isErrorText(passwordMessage) ? "message-error" : "message-success"}`}>
                    {passwordMessage}
                  </div>
                )}

                <button type="submit" className="change-password-btn" disabled={loading}>
                  Đổi mật khẩu
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="profile-empty">
            <p>Bạn chưa đăng nhập. Hãy đăng nhập để xem thông tin tài khoản.</p>
            <Link to={`/${ROUTERS.USER.HOME}`} state={{ showLogin: true }}>
              Đăng nhập ngay
            </Link>
          </div>
        )}
      </div>

      {showSuccessPopup && (
        <div className="profile-popup-overlay" onClick={closeSuccessPopup}>
          <div className="profile-popup" onClick={(e) => e.stopPropagation()}>
            <h3>Thành công</h3>
            <p>{successPopupMessage || "Thao tác thành công."}</p>
            <button type="button" onClick={closeSuccessPopup}>
              Đóng
            </button>
          </div>
        </div>
      )}

      {showErrorPopup && (
        <div className="profile-popup-overlay" onClick={closeErrorPopup}>
          <div className="profile-popup error" onClick={(e) => e.stopPropagation()}>
            <h3>Có lỗi xảy ra</h3>
            <p>{errorPopupMessage || "Có lỗi xảy ra."}</p>
            <button type="button" onClick={closeErrorPopup}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default memo(ProfilePage);