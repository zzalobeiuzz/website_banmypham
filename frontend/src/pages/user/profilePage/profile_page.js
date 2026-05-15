import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import { useAuth } from "../context/AuthContext";
import { ROUTERS } from "../../../utils/router";
import "./profile_page.scss";

const getInitials = (fullName = "") => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const resolveAvatarSrc = (avatar) => {
  const value = String(avatar || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  const normalized = value
    .replace(/^\/+/, "")
    .replace(/^uploads\/?assets\/?/i, "");
  return `${UPLOAD_BASE}/${normalized}`;
};

const resolveProductImageSrc = (image) => {
  const value = String(image || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  const normalized = value
    .replace(/^\/+/, "")
    .replace(/^uploads\/?assets\/?pictures\/?/i, "")
    .replace(/^pictures\/?/i, "");

  return `${UPLOAD_BASE}/pictures/${normalized}`;
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

const PROFILE_FALLBACK_TEXT = "Chưa cập nhật";

const normalizeDisplayValue = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return PROFILE_FALLBACK_TEXT;

  // Handle common mojibake text coming from legacy data/source.
  if (/chưa\s*c\?p\s*nh\?t/i.test(raw)) return PROFILE_FALLBACK_TEXT;

  return raw;
};

const ProfilePage = () => {
  const [avatarMessage, setAvatarMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [nameMessage, setNameMessage] = useState("");
  const [fieldMessage, setFieldMessage] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [isEditingFields, setIsEditingFields] = useState(false);
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
  const [activeTab, setActiveTab] = useState("info"); // "info" or "orders"
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [orderSearchKeyword, setOrderSearchKeyword] = useState("");
  const [amountSortOrder, setAmountSortOrder] = useState("asc");
  const [dateSortOrder, setDateSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const phoneEditableRef = useRef(null);
  const addressEditableRef = useRef(null);
  const didFetchProfileRef = useRef(false);
  const didFetchOrdersRef = useRef(false);
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
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
    const basePhone = normalizeDisplayValue(user?.phoneNumber || user?.phone);
    const baseAddress = normalizeDisplayValue(user?.address);

    setEditPhoneValue(basePhone);
    setEditAddressValue(baseAddress);

    if (phoneEditableRef.current)
      phoneEditableRef.current.textContent = basePhone;
    if (addressEditableRef.current)
      addressEditableRef.current.textContent = baseAddress;
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
    const normalizedUser = user
      ? {
          ...user,
          email: user.email || "",
          phoneNumber: user.phoneNumber || user.phone || "",
          address: user.address || "",
          profileName: user.profileName || user.name || "Người dùng",
        }
      : null;

    if (!normalizedUser) {
      setIsInitialLoading(false);
      return;
    }

    setEditNameValue(normalizedUser.profileName || "Người dùng");
    setEditPhoneValue(normalizedUser.phoneNumber || "");
    setEditAddressValue(normalizedUser.address || "");
    if (phoneEditableRef.current)
      phoneEditableRef.current.textContent = normalizeDisplayValue(
        normalizedUser.phoneNumber,
      );
    if (addressEditableRef.current)
      addressEditableRef.current.textContent = normalizeDisplayValue(
        normalizedUser.address,
      );

    const fetchLatestProfile = async () => {
      if (didFetchProfileRef.current) {
        setIsInitialLoading(false);
        return;
      }

      didFetchProfileRef.current = true;

      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const response = await request(
          "GET",
          `${API_BASE}/api/user/auth/profile`,
          null,
          {
            Authorization: `Bearer ${token}`,
          },
        );

        if (response?.success && response?.data) {
          const updatedUser = {
            ...(normalizedUser || {}),
            email: response.data.email,
            name: response.data.displayName || "",
            profileName: response.data.name || response.data.displayName || "",
            phoneNumber: response.data.phoneNumber || "",
            address: response.data.address || "",
            avatar: response.data.avatar || null,
            role: response.data.role,
          };

          updateUser(updatedUser);
          setEditNameValue(updatedUser.profileName || "Người dùng");
          setEditPhoneValue(updatedUser.phoneNumber || "");
          setEditAddressValue(updatedUser.address || "");
          if (phoneEditableRef.current)
            phoneEditableRef.current.textContent = normalizeDisplayValue(
              updatedUser.phoneNumber,
            );
          if (addressEditableRef.current)
            addressEditableRef.current.textContent = normalizeDisplayValue(
              updatedUser.address,
            );
        }
      } catch (error) {
        // Bỏ qua lỗi fetch profile để không chặn màn hình
      }
    };

    const initProfileData = async () => {
      try {
        await fetchLatestProfile();
      } finally {
        setIsInitialLoading(false);
      }
    };

    initProfileData();
  }, [request, updateUser, user]);

  useEffect(() => {
    if (isEditingFields) {
      placeCaretAtEnd(phoneEditableRef.current);
    }
  }, [isEditingFields]);

  // Use effect để tự động tải đơn hàng khi chuyển sang tab "orders"
  useEffect(() => {
    if (activeTab === "orders" && !didFetchOrdersRef.current && user?.id) {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        setOrdersError("");

        const token = localStorage.getItem("accessToken");

        if (!token) {
          setOrdersError("Vui lòng đăng nhập để xem đơn hàng.");
          setOrdersLoading(false);
          return;
        }
        try {
          const res = await request(
            "GET",
            `${API_BASE}/api/user/orders`,
            null,
            {
              Authorization: `Bearer ${token}`,
            },
          );
          console.log("Danh sách đơn hàng:", res);
          if (res?.success) {
            setOrders(res.orders || res.data || []);
            didFetchOrdersRef.current = true;
          } else {
            setOrdersError(res?.message || "Không thể tải đơn hàng.");
          }
        } catch (err) {
          setOrdersError(err?.message || "Lỗi khi tải đơn hàng.");
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab, user?.id, request]);

  useEffect(() => {
    const messages = [
      avatarMessage,
      nameMessage,
      fieldMessage,
      passwordMessage,
    ].filter(Boolean);
    const latestError = messages.find((message) => isErrorText(message));

    if (latestError && latestError !== errorPopupMessage) {
      setErrorPopupMessage(latestError);
      setShowErrorPopup(true);
    }
  }, [
    avatarMessage,
    nameMessage,
    fieldMessage,
    passwordMessage,
    errorPopupMessage,
  ]);

  // -------------------- HÀM ĐỊNH DẠNG PHƯƠNG THỨC THANH TOÁN --------------------
  const formatPaymentMethod = (method) => {
    const value = String(method || "")
      .trim()
      .toUpperCase();

    switch (value) {
      case "COD":
        return "Thanh toán khi nhận hàng";

      case "MOMO":
        return "Thanh toán ví MoMo";

      case "TRANSFER":
        return "Chuyển khoản ngân hàng";

      default:
        return method || "-";
    }
  };

  // Hàm mở chi tiết đơn hàng
  const openOrderDetail = async (orderId) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      setOrderDetailLoading(true);
      setSelectedOrder(null);
      const res = await request(
        "GET",
        `${API_BASE}/api/user/orders/detail/${encodeURIComponent(orderId)}`,
        null,
        {
          Authorization: `Bearer ${token}`,
        },
      );
      console.log("Chi tiết đơn hàng:", res);
      if (res?.success) setSelectedOrder(res.order || null);
    } catch (err) {
      setOrdersError(err?.message || "Không thể tải chi tiết đơn hàng.");
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const displayName = user?.profileName || user?.name || "Người dùng";
  const displayEmail = normalizeDisplayValue(user?.email);
  const displayPhone = normalizeDisplayValue(user?.phoneNumber || user?.phone);
  const displayAddress = normalizeDisplayValue(user?.address);

  const statusOptions = useMemo(() => {
    const uniqueStatuses = new Set(
      (Array.isArray(orders) ? orders : [])
        .map((order) => String(order?.status || "").trim())
        .filter(Boolean),
    );
    return ["all", ...Array.from(uniqueStatuses)];
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const keyword = String(orderSearchKeyword || "")
      .trim()
      .toLowerCase();
    const selectedStatus = String(statusFilter || "all").trim();

    let next = Array.isArray(orders) ? [...orders] : [];

    if (selectedStatus !== "all") {
      next = next.filter(
        (order) => String(order?.status || "").trim() === selectedStatus,
      );
    }

    if (keyword) {
      next = next.filter((order) =>
        String(order?.id || "")
          .toLowerCase()
          .includes(keyword),
      );
    }

    next.sort((a, b) => {
      const totalA = Number(a?.total) || 0;
      const totalB = Number(b?.total) || 0;
      const timeA = new Date(a?.createdAt || 0).getTime() || 0;
      const timeB = new Date(b?.createdAt || 0).getTime() || 0;

      const amountCompare =
        amountSortOrder === "asc" ? totalA - totalB : totalB - totalA;
      if (amountCompare !== 0) return amountCompare;

      return dateSortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    return next;
  }, [
    orders,
    orderSearchKeyword,
    amountSortOrder,
    dateSortOrder,
    statusFilter,
  ]);

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("Phiên đăng nhập đã hết hạn.");
    }

    const refreshRes = await request(
      "POST",
      `${API_BASE}/api/admin/refresh-token`,
      {
        refreshToken,
      },
    );

    if (!refreshRes?.accessToken) {
      throw new Error("Không thể làm mới access token.");
    }

    localStorage.setItem("accessToken", refreshRes.accessToken);
    return refreshRes.accessToken;
  };

  const updateLocalUserAvatar = (avatar) => {
    updateUser({ ...(user || {}), avatar });
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

      const response = await request(
        "PUT",
        `${API_BASE}/api/user/auth/avatar`,
        formData,
        {
          Authorization: `Bearer ${token}`,
        },
      );

      if (response?.avatar) {
        updateLocalUserAvatar(response.avatar);
        showSuccessMessage(
          setAvatarMessage,
          "Cập nhật ảnh đại diện thành công.",
        );
      }
    } catch (error) {
      const isAuthError = error?.status === 401;
      if (!isAuthError) {
        showErrorMessage(
          setAvatarMessage,
          error?.message || "Cập nhật ảnh đại diện thất bại.",
        );
        return;
      }

      try {
        const newAccessToken = await refreshAccessToken();
        const retryFormData = new FormData();
        retryFormData.append("avatar", file);

        const retryRes = await request(
          "PUT",
          `${API_BASE}/api/user/auth/avatar`,
          retryFormData,
          {
            Authorization: `Bearer ${newAccessToken}`,
          },
        );

        if (retryRes?.avatar) {
          updateLocalUserAvatar(retryRes.avatar);
          showSuccessMessage(
            setAvatarMessage,
            "Cập nhật ảnh đại diện thành công.",
          );
          return;
        }

        showErrorMessage(
          setAvatarMessage,
          "Không nhận được dữ liệu ảnh đại diện mới.",
        );
      } catch (refreshError) {
        showErrorMessage(
          setAvatarMessage,
          "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
        );
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
      showErrorMessage(
        setPasswordMessage,
        "Mật khẩu mới phải có ít nhất 6 ký tự.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorMessage(
        setPasswordMessage,
        "Mật khẩu mới và xác nhận mật khẩu không khớp.",
      );
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
        { Authorization: `Bearer ${authToken}` },
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
        setShowChangePassword(false); // ✅ thêm dòng này
        return;
      }

      setPasswordMessage(response?.message || "Đổi mật khẩu thất bại.");
    } catch (error) {
      if (error?.status !== 401) {
        showErrorMessage(
          setPasswordMessage,
          error?.message || "Đổi mật khẩu thất bại.",
        );
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
          setTimeout(() => {
            setShowChangePassword(false);
          }, 800);
          return;
        }

        showErrorMessage(
          setPasswordMessage,
          retryResponse?.message || "Đổi mật khẩu thất bại.",
        );
      } catch (refreshError) {
        showErrorMessage(
          setPasswordMessage,
          "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
        );
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
    logout();
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
          { Authorization: `Bearer ${accessToken}` },
        );
      };

      const response = await submitRequest(token);
      if (response?.success) {
        updateUser({ ...(user || {}), profileName: editNameValue.trim() });
        setEditingName(false);
        showSuccessMessage(setNameMessage, "Cập nhật tên thành công.");
        return;
      }

      showErrorMessage(
        setNameMessage,
        response?.message || "Cập nhật tên thất bại.",
      );
    } catch (error) {
      if (error?.status !== 401) {
        showErrorMessage(
          setNameMessage,
          error?.message || "Cập nhật tên thất bại.",
        );
        return;
      }

      try {
        const newAccessToken = await refreshAccessToken();
        const retryResponse = await request(
          "PUT",
          `${API_BASE}/api/user/auth/update-profile`,
          { name: editNameValue.trim() },
          { Authorization: `Bearer ${newAccessToken}` },
        );

        if (retryResponse?.success) {
          updateUser({ ...(user || {}), profileName: editNameValue.trim() });
          setEditingName(false);
          showSuccessMessage(setNameMessage, "Cập nhật tên thành công.");
          return;
        }

        showErrorMessage(
          setNameMessage,
          retryResponse?.message || "Cập nhật tên thất bại.",
        );
      } catch (refreshError) {
        showErrorMessage(
          setNameMessage,
          "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
        );
      }
    }
  };

  const handleSaveProfileFields = async () => {
    const nextEmail = String(user?.email || "").trim();
    const nextPhone = (phoneEditableRef.current?.textContent || "").trim();
    const nextAddress = (addressEditableRef.current?.textContent || "").trim();

    if (!nextPhone || !nextAddress) {
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
          { Authorization: `Bearer ${accessToken}` },
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
        showErrorMessage(
          setFieldMessage,
          response?.message || "Cập nhật thông tin thất bại.",
        );
        return;
      }

      const updatedUser = {
        ...(user || {}),
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        address: payload.address,
      };

      setEditPhoneValue(payload.phoneNumber);
      setEditAddressValue(payload.address);
      updateUser(updatedUser);
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
        <div
          className="profile-card profile-loading-card"
          aria-busy="true"
          aria-live="polite"
        >
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
          <p className="profile-loading-text">
            Đang tải thông tin tài khoản...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <div className="profile-card">
        {/* Tab buttons - at the top */}
        <div className="profile-tabs">
          <button
            type="button"
            className={`tab-button ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            Thông tin cá nhân
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Đơn hàng của tôi
          </button>
        </div>

        {/* Dynamic title based on active tab */}
        <div className="profile-page-title">
          <h1>
            {activeTab === "info" ? "Thông tin cá nhân" : "Đơn hàng của tôi"}
          </h1>
        </div>

        {activeTab === "info" && (
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
                  <img
                    src={resolveAvatarSrc(user.avatar)}
                    alt="avatar"
                    className="profile-avatar-image"
                  />
                ) : (
                  <div className="profile-avatar">
                    {getInitials(displayName)}
                  </div>
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
                      <button
                        type="submit"
                        className="btn-save"
                        disabled={loading}
                      >
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
                  <div
                    className={`name-message ${isErrorText(nameMessage) ? "message-error" : "message-success"}`}
                  >
                    {nameMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-right-column">
              {avatarMessage && (
                <div
                  className={`avatar-message ${isErrorText(avatarMessage) ? "message-error" : "message-success"}`}
                >
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
                        className="editable-strong"
                        contentEditable={false}
                        suppressContentEditableWarning
                      >
                        {displayEmail}
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
        )}

        {activeTab === "orders" && (
          <div className="orders-section">
            <div className="orders-toolbar">
              <input
                type="text"
                className="orders-search-input"
                placeholder="Tìm theo mã đơn hàng..."
                value={orderSearchKeyword}
                onChange={(e) => setOrderSearchKeyword(e.target.value)}
              />
              <div className="orders-filter-group">
                <label className="orders-filter-label">Số tiền</label>
                <select
                  className="orders-filter-select"
                  value={amountSortOrder}
                  onChange={(e) => setAmountSortOrder(e.target.value)}
                >
                  <option value="asc">Thấp → Cao</option>
                  <option value="desc">Cao → Thấp</option>
                </select>
              </div>
              <div className="orders-filter-group">
                <label className="orders-filter-label">Ngày</label>
                <select
                  className="orders-filter-select"
                  value={dateSortOrder}
                  onChange={(e) => setDateSortOrder(e.target.value)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>
              <div className="orders-filter-group">
                <label className="orders-filter-label">Trạng thái</label>
                <select
                  className="orders-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "all" ? "Tất cả" : status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {ordersLoading && <p>Đang tải...</p>}
            {ordersError && <p className="error">{ordersError}</p>}
            {!ordersLoading && !ordersError && orders.length === 0 && (
              <p className="no-orders">Bạn chưa có đơn hàng nào.</p>
            )}
            {!ordersLoading &&
              !ordersError &&
              orders.length > 0 &&
              visibleOrders.length === 0 && (
                <p className="no-orders">Không tìm thấy đơn hàng phù hợp.</p>
              )}
            {!ordersLoading && visibleOrders.length > 0 && (
              <div className="order-list">
                <div className="header-row">
                  <ul className="header-columns">
                    <li className="column">Mã đơn</li>
                    <li className="column">Tổng</li>
                    <li className="column">Trạng thái</li>
                    <li className="column">Ngày</li>
                    <li className="column">Hành động</li>
                  </ul>
                </div>
                <div className="orders-body">
                  {visibleOrders.map((o) => (
                    <div key={o.id} className="order-row">
                      <div className="col">{o.id}</div>
                      <div className="col">
                        {Number(o.total).toLocaleString()} đ
                      </div>
                      <div className="col">{o.status}</div>
                      <div className="col">
                        {new Date(o.createdAt).toLocaleString()}
                      </div>
                      <div className="col">
                        <button
                          type="button"
                          onClick={() => openOrderDetail(o.id)}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(orderDetailLoading || selectedOrder) && (
              <div
                className="order-detail-popup"
                onClick={() => {
                  setSelectedOrder(null);
                  setOrderDetailLoading(false);
                }}
              >
                <div
                  className="popup-body"
                  onClick={(e) => e.stopPropagation()}
                >
                  {orderDetailLoading && <p>Đang tải chi tiết đơn hàng...</p>}

                  {!orderDetailLoading && selectedOrder && (
                    <>
                      {/* ================= HEADER ================= */}
                      <div className="popup-top">
                        <h3>Chi tiết đơn hàng</h3>

                        <button
                          type="button"
                          className="popup-close"
                          onClick={() => {
                            setSelectedOrder(null);
                            setOrderDetailLoading(false);
                          }}
                        >
                          Đóng
                        </button>
                      </div>

                      {/* ================= THÔNG TIN ĐƠN ================= */}
                      <div className="order-header-grid">
                        {/* ================= THÔNG TIN ĐẶT HÀNG ================= */}
                        <div className="order-card">
                          <h4>Thông tin đặt hàng</h4>

                          <div className="order-card-grid">
                            <div className="order-card-item">
                              <span className="label">Mã đơn</span>

                              <span className="value">#{selectedOrder.id}</span>
                            </div>

                            <div className="order-card-item">
                              <span className="label">Ngày đặt</span>

                              <span className="value">
                                {selectedOrder.createdAt
                                  ? new Date(
                                      selectedOrder.createdAt,
                                    ).toLocaleDateString("vi-VN")
                                  : "-"}
                              </span>
                            </div>

                            <div className="order-card-item">
                              <span className="label">Thời gian</span>

                              <span className="value">
                                {selectedOrder.createdAt
                                  ? new Date(
                                      selectedOrder.createdAt,
                                    ).toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "-"}
                              </span>
                            </div>

                            <div className="order-card-item">
                              <span className="label">Người nhận</span>

                              <span className="value">
                                {selectedOrder.shippingInfo?.name ||
                                  "Người nhận"}
                              </span>
                            </div>

                            <div className="order-card-item">
                              <span className="label">Số điện thoại</span>

                              <span className="value">
                                {selectedOrder.shippingInfo?.phone || "-"}
                              </span>
                            </div>

                            <div className="order-card-item ">
                              <span className="label">Địa chỉ</span>

                              <span className="value">
                                {selectedOrder.shippingInfo?.address || "-"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ================= TỔNG QUAN ĐƠN HÀNG ================= */}
                        <div className="order-card">
                          <h4>Tổng quan đơn hàng</h4>

                          <div className="order-card-flex">
                            <div className="order-card-item">
                              <span className="label">Trạng thái</span>

                              <span className="value status">
                                {selectedOrder.status}
                              </span>
                            </div>

                            <div className="order-card-item">
                              <span className="label">Thanh toán</span>

                              <span className="value">
                                {formatPaymentMethod(
                                  selectedOrder.paymentMethod ||
                                    selectedOrder.PaymentMethod,
                                )}
                              </span>
                            </div>

                            <div className="order-card-item">
                              <span className="label">Voucher</span>

                              <span className="value">
                                {selectedOrder.voucher ||
                                  selectedOrder.Voucher ||
                                  "Không áp dụng"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= ITEMS ================= */}
                      <div className="items">
                        <h4>Sản phẩm</h4>

                        <ul>
                          {(selectedOrder.items || []).map((it, idx) => {
                            const imageSrc = resolveProductImageSrc(
                              it.image || it.Image,
                            );

                            const productName =
                              it.productName ||
                              it.ProductName ||
                              it.name ||
                              "Sản phẩm";

                            const productId =
                              it.productId || it.ProductID || "-";

                            const quantity = it.quantity || it.Quantity || 0;

                            const originalPrice = Number(
                              it.originalPrice ||
                                it.OriginalPrice ||
                                it.price ||
                                0,
                            );

                            const salePrice = Number(
                              it.salePrice || it.SalePrice || 0,
                            );

                            const lineTotal = Number(
                              it.lineTotal ||
                                it.LineTotal ||
                                (salePrice || originalPrice) * quantity ||
                                0,
                            );

                            return (
                              <li
                                key={`${productId}-${idx}`}
                                className="order-item-row"
                              >
                                <div className="order-item-main">
                                  <div className="order-item-image-wrap">
                                    {imageSrc ? (
                                      <img
                                        src={imageSrc}
                                        alt={productName}
                                        className="order-item-image"
                                      />
                                    ) : (
                                      <div className="order-item-image-fallback">
                                        No image
                                      </div>
                                    )}
                                  </div>

                                  <div className="order-item-meta">
                                    <strong className="order-item-name">
                                      {productName}
                                    </strong>

                                    <span className="order-item-id">
                                      Mã SP: {productId}
                                    </span>

                                    <span className="order-item-qty">
                                      Số lượng: {quantity}
                                    </span>

                                    <div className="order-item-prices">
                                      {salePrice > 0 ? (
                                        <>
                                          <span className="price-sale">
                                            {salePrice.toLocaleString()} đ
                                          </span>

                                          <span className="price-original">
                                            {originalPrice.toLocaleString()} đ
                                          </span>
                                        </>
                                      ) : (
                                        <span className="price-normal">
                                          {originalPrice.toLocaleString()} đ
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <span className="order-item-total">
                                  {lineTotal.toLocaleString()} đ
                                </span>
                              </li>
                            );
                          })}
                        </ul>

                        {/* ================= SUMMARY ================= */}
                        <div className="order-summary-footer">
                          {/* Tổng số lượng */}
                          <div className="summary-line">
                            <span>Tổng số lượng</span>

                            <strong>
                              {(selectedOrder.items || []).reduce(
                                (sum, item) =>
                                  sum +
                                  Number(item.quantity || item.Quantity || 0),
                                0,
                              )}{" "}
                              sản phẩm
                            </strong>
                          </div>

                          {/* Tổng giảm giá từ giá gốc - giá sale */}
                          <div className="summary-line">
                            <span>Giảm giá</span>

                            <strong className="discount">
                              -
                              {(selectedOrder.items || [])
                                .reduce((sum, item) => {
                                  const quantity = Number(
                                    item.quantity || item.Quantity || 0,
                                  );

                                  const originalPrice = Number(
                                    item.originalPrice ||
                                      item.OriginalPrice ||
                                      item.price ||
                                      0,
                                  );

                                  const salePrice = Number(
                                    item.salePrice ||
                                      item.SalePrice ||
                                      originalPrice,
                                  );

                                  const discountPerItem = Math.max(
                                    originalPrice - salePrice,
                                    0,
                                  );

                                  return sum + discountPerItem * quantity;
                                }, 0)
                                .toLocaleString()}{" "}
                              đ
                            </strong>
                          </div>

                          {/* Tổng tiền */}
                          <div className="summary-line total">
                            <span>Tổng tiền</span>

                            <strong>
                              {Number(
                                selectedOrder.total || selectedOrder.Total || 0,
                              ).toLocaleString()}{" "}
                              đ
                            </strong>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
              <button
                type="button"
                className="btn-danger"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>

            {showChangePassword && (
              <form
                className="change-password-box"
                onSubmit={handleChangePassword}
              >
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
                  <div
                    className={`password-message ${isErrorText(passwordMessage) ? "message-error" : "message-success"}`}
                  >
                    {passwordMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="change-password-btn"
                  disabled={loading}
                >
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
          <div
            className="profile-popup error"
            onClick={(e) => e.stopPropagation()}
          >
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
