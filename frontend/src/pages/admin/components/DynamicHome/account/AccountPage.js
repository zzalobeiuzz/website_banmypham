import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useHttp from "../../../../../hooks/useHttp";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import ToolBar from "../../ToolBar";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import Notification from "../../shared/Notification";
import useMinimumLoading from "../../useMinimumLoading";
import CreateAccountPopup from "./CreateAccountPopup";
import "./style.scss";

const TXT = {
  title: "Quản lý tài khoản",
  noData: "Không có dữ liệu tài khoản",
  loading: "Đang tải danh sách tài khoản...",
};

const ROLE_FILTERS = {
  ALL: "all",
  ADMIN: "admin",
  CUSTOMER: "customer",
};

const COLUMN_WIDTH_MAP = {
  Email: 280,
  DisplayName: 220,
  Avatar: 60,
  Role: 140,
  IsActive: 130,
  CreatedAt: 170,
  UpdatedAt: 170,
};

const COLUMN_LABEL_MAP = {
  Email: "Email",
  DisplayName: "Tên hiển thị",
  Avatar: "Ảnh",
  Role: "Vai trò",
  IsActive: "Trạng thái",
  CreatedAt: "Ngày tạo",
  UpdatedAt: "Ngày cập nhật",
  Id: "Mã",
  ID: "Mã",
};

const DEFAULT_COLUMN_WIDTH = 180;
const ACTION_COLUMN_WIDTH = 330;

const normalizeValue = (value, column = "") => {
  if (String(column).toLowerCase() === "role") {
    const role = Number(value);
    if (role === 1) return "Admin";
    if (role === 0) return "Khách hàng";
  }

  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }
  return String(value);
};

const getRoleMeta = (value) => {
  const role = Number(value);
  if (role === 1) return { label: "Admin", className: "is-admin" };
  if (role === 0) return { label: "Khách hàng", className: "is-customer" };
  return { label: String(value || "Không rõ"), className: "is-unknown" };
};

const getActiveMeta = (value) => {
  const active = Number(value) === 1 || value === true || String(value).toLowerCase() === "active";
  return active
    ? { label: "Hoạt động", className: "is-active" }
    : { label: "Tạm dừng", className: "is-inactive" };
};

const getColumnWidth = (column) => {
  const exact = COLUMN_WIDTH_MAP[column];
  if (exact) return exact;

  const normalized = String(column || "").toLowerCase();
  if (normalized.includes("email")) return 280;
  if (normalized.includes("name")) return 220;
  if (normalized.includes("avatar") || normalized.includes("image")) return 60;
  if (normalized.includes("date") || normalized.includes("time")) return 170;
  if (normalized.includes("role")) return 140;
  return DEFAULT_COLUMN_WIDTH;
};

const getColumnLabel = (column) => {
  const exact = COLUMN_LABEL_MAP[column];
  if (exact) return exact;

  const normalized = String(column || "").toLowerCase();
  if (normalized.includes("email")) return "Email";
  if (normalized.includes("display") && normalized.includes("name")) return "Tên hiển thị";
  if (normalized.includes("name")) return "Tên";
  if (normalized.includes("avatar") || normalized.includes("image")) return "Ảnh đại diện";
  if (normalized.includes("role")) return "Vai trò";
  if (normalized.includes("active") || normalized.includes("status")) return "Trạng thái";
  if (normalized.includes("create") && normalized.includes("date")) return "Ngày tạo";
  if (normalized.includes("update") && normalized.includes("date")) return "Ngày cập nhật";
  if (normalized.includes("date") || normalized.includes("time")) return "Thời gian";
  return column;
};

const isAvatarColumn = (column) => String(column || "").toLowerCase().includes("avatar");
const isRoleColumn = (column) => String(column || "").toLowerCase().includes("role");
const isDateColumn = (column) => /date|time|at/i.test(String(column || ""));

const resolveAvatarSrc = (avatarValue) => {
  const value = String(avatarValue || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  const normalized = value.replace(/^\/+/, "").replace(/^uploads\/assets\/?/i, "");
  return `${UPLOAD_BASE}/${normalized}`;
};

const formatDetailValue = (value, column = "") => {
  if (isDateColumn(column) && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("vi-VN");
    }
  }

  return normalizeValue(value, column) || "-";
};

const getCurrentUserEmail = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return String(user?.email || user?.Email || user?.id || "").trim().toLowerCase();
  } catch (error) {
    return "";
  }
};

const AccountPage = () => {
  const { request } = useHttp();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState(ROLE_FILTERS.ALL);
  const [resettingEmail, setResettingEmail] = useState("");
  const [deletingEmail, setDeletingEmail] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [savingEditAccount, setSavingEditAccount] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [detailAccount, setDetailAccount] = useState(null);
  const [createAccountForm, setCreateAccountForm] = useState({
    email: "",
    displayName: "",
    password: "",
    role: 0,
    avatarFile: null,
    avatarUrl: "",
  });
  const [editAccountForm, setEditAccountForm] = useState({
    email: "",
    displayName: "",
    avatar: "",
    avatarFile: null,
    avatarUrl: "",
    role: 0,
    isActive: 1,
  });
  const [loading, setLoading] = useState(false);
  const showLoading = useMinimumLoading(loading, 500);
  const [notify, setNotify] = useState({ open: false, status: "info", message: "" });
  const [createAvatarUrlBroken, setCreateAvatarUrlBroken] = useState(false);
  const [editAvatarUrlBroken, setEditAvatarUrlBroken] = useState(false);
  const createAvatarPreviewUrl = useMemo(() => {
    if (createAccountForm.avatarFile) {
      return URL.createObjectURL(createAccountForm.avatarFile);
    }

    if (createAvatarUrlBroken) return "";
    return String(createAccountForm.avatarUrl || "").trim();
  }, [createAccountForm.avatarFile, createAccountForm.avatarUrl, createAvatarUrlBroken]);

  const editAvatarPreviewUrl = useMemo(() => {
    if (editAccountForm.avatarFile) {
      return URL.createObjectURL(editAccountForm.avatarFile);
    }

    const webAvatar = String(editAccountForm.avatarUrl || "").trim();
    if (webAvatar) return editAvatarUrlBroken ? "" : webAvatar;

    return resolveAvatarSrc(editAccountForm.avatar);
  }, [editAccountForm.avatar, editAccountForm.avatarFile, editAccountForm.avatarUrl, editAvatarUrlBroken]);

  useEffect(() => {
    return () => {
      if (createAvatarPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(createAvatarPreviewUrl);
      }
    };
  }, [createAvatarPreviewUrl]);

  useEffect(() => {
    return () => {
      if (editAvatarPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(editAvatarPreviewUrl);
      }
    };
  }, [editAvatarPreviewUrl]);

  const showPopup = ({ status, message }) => {
    setNotify({
      open: true,
      status: status || "info",
      message: String(message || ""),
    });
  };

  const closePopup = () => {
    setNotify((prev) => ({ ...prev, open: false }));
  };

  const handleSearchChange = (keyword) => {
    setSearchKeyword(keyword);
  };

  const closeDetailPopup = () => {
    setDetailAccount(null);
  };

  const openEditPopup = (row) => {
    setEditAvatarUrlBroken(false);
    setEditAccountForm({
      email: getAccountEmail(row),
      displayName: String(row?.DisplayName || row?.displayName || "").trim(),
      avatar: String(row?.Avatar || row?.avatar || "").trim(),
      avatarFile: null,
      avatarUrl: "",
      role: Number(row?.Role) === 1 ? 1 : 0,
      isActive: Number(row?.IsActive) === 0 ? 0 : 1,
    });
    setShowEditPopup(true);
  };

  const openEditFromDetail = () => {
    if (!detailAccount) return;
    const account = detailAccount;
    closeDetailPopup();
    openEditPopup(account);
  };

  const closeEditPopup = () => {
    if (savingEditAccount) return;
    setShowEditPopup(false);
  };

  const getDroppedImageUrl = (event) => {
    const normalizeDroppedUrl = (value) => {
      const normalized = String(value || "")
        .trim()
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");

      if (normalized.startsWith("//")) return `https:${normalized}`;
      return normalized;
    };

    const uriList = normalizeDroppedUrl(event?.dataTransfer?.getData("text/uri-list"));
    if (/^https?:\/\//i.test(uriList) || uriList.startsWith("data:")) return uriList;

    const plain = normalizeDroppedUrl(event?.dataTransfer?.getData("text/plain"));
    if (/^https?:\/\//i.test(plain) || plain.startsWith("data:")) return plain;

    const html = String(event?.dataTransfer?.getData("text/html") || "").trim();
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    const imgSrc = normalizeDroppedUrl(imgMatch?.[1]);
    if (/^https?:\/\//i.test(imgSrc) || imgSrc.startsWith("data:")) return imgSrc;

    return "";
  };

  const handleChangeEditField = (field, value) => {
    if (field === "avatarUrl") {
      setEditAvatarUrlBroken(false);
    }
    setEditAccountForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditAvatarFile = (file) => {
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      showPopup({ status: "warning", message: "Vui long chon dung file anh avatar." });
      return;
    }

    setEditAccountForm((prev) => ({
      ...prev,
      avatarFile: file,
      avatarUrl: "",
    }));
    setEditAvatarUrlBroken(false);
  };

  const handleEditAvatarDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleEditAvatarFile(file);
      return;
    }

    const droppedUrl = getDroppedImageUrl(event);
    if (droppedUrl) {
      setEditAvatarUrlBroken(false);
      setEditAccountForm((prev) => ({
        ...prev,
        avatarFile: null,
        avatarUrl: droppedUrl,
      }));
      showPopup({ status: "info", message: "Đã nhận ảnh từ web. Đang kiểm tra ảnh..." });
      return;
    }

    showPopup({ status: "warning", message: "Chỉ nhận file ảnh hoặc ảnh/link ảnh kéo từ web." });
  };

  const handleEditAvatarDragOver = (event) => {
    event.preventDefault();
  };

  const logoutDeletedCurrentAccount = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    navigate("/", { replace: true });
  };

  const getAuthHeaders = (token) => ({ Authorization: `Bearer ${token}` });

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("Không tìm thấy refresh token");
    }

    const refreshRes = await request("POST", `${API_BASE}/api/admin/refresh-token`, {
      refreshToken,
    });

    if (!refreshRes?.accessToken) {
      throw new Error("Không thể làm mới access token");
    }

    localStorage.setItem("accessToken", refreshRes.accessToken);
    return refreshRes.accessToken;
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      let token = localStorage.getItem("accessToken");

      let res;
      try {
        res = await request("GET", `${API_BASE}/api/admin/accounts`, null, getAuthHeaders(token));
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request("GET", `${API_BASE}/api/admin/accounts`, null, getAuthHeaders(token));
      }

      if (!res?.success) {
        showPopup({ status: "error", message: res?.message || "Không thể tải dữ liệu tài khoản." });
        return;
      }

      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      showPopup({ status: "error", message: error?.message || "Không thể tải dữ liệu tài khoản." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(() => {
    if (!accounts.length) return [];
    const keySet = new Set();
    accounts.forEach((row) => Object.keys(row || {}).forEach((key) => keySet.add(key)));
    return Array.from(keySet).filter((key) => !/password/i.test(key));
  }, [accounts]);

  const getAccountEmail = (row) => String(row?.Email || row?.email || row?.AccountEmail || "").trim();

  const filteredAccounts = useMemo(() => {
    let filtered = accounts.filter((row) => {
      const role = Number(row?.Role);
      if (roleFilter === ROLE_FILTERS.ADMIN) return role === 1;
      if (roleFilter === ROLE_FILTERS.CUSTOMER) return role === 0;
      return true;
    });

    const keyword = String(searchKeyword || "").trim().toLowerCase();
    if (!keyword) return filtered;

    return filtered.filter((row) => {
      const email = String(row?.Email || "").toLowerCase();
      const displayName = String(row?.DisplayName || "").toLowerCase();
      return email.includes(keyword) || displayName.includes(keyword);
    });
  }, [accounts, roleFilter, searchKeyword]);

  const tableWidth = useMemo(() => {
    const dataColumnsWidth = columns.reduce((sum, column) => sum + getColumnWidth(column), 0);
    return dataColumnsWidth + ACTION_COLUMN_WIDTH;
  }, [columns]);

  const dashboardStats = useMemo(() => {
    const total = filteredAccounts.length;
    const adminCount = filteredAccounts.filter((row) => Number(row?.Role) === 1).length;
    const customerCount = filteredAccounts.filter((row) => Number(row?.Role) === 0).length;
    return {
      total,
      adminCount,
      customerCount,
    };
  }, [filteredAccounts]);

  const renderCellValue = (row, column) => {
    const rawValue = row?.[column];
    if (isAvatarColumn(column)) {
      const src = resolveAvatarSrc(rawValue);
      if (!src) return "-";
      return <img src={src} alt="avatar" className="account-avatar-thumb" />;
    }

    if (String(column).toLowerCase() === "role") {
      const roleMeta = getRoleMeta(rawValue);
      return <span className={`account-role-badge ${roleMeta.className}`}>{roleMeta.label}</span>;
    }

    if (String(column).toLowerCase() === "isactive") {
      const activeMeta = getActiveMeta(rawValue);
      return (
        <span className={`account-status-badge ${activeMeta.className}`}>
          <span className="status-dot" />
          {activeMeta.label}
        </span>
      );
    }

    return normalizeValue(rawValue, column) || "-";
  };

  const handleResetPassword = async (row) => {
    const email = getAccountEmail(row);
    if (!email) {
      showPopup({ status: "warning", message: "Không tìm thấy email tài khoản để reset." });
      return;
    }

    const input = window.prompt(`Nhập mật khẩu mới cho ${email}`);
    if (input === null) return;

    const newPassword = String(input || "").trim();
    if (newPassword.length < 6) {
      showPopup({ status: "warning", message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }

    try {
      setResettingEmail(email);
      let token = localStorage.getItem("accessToken");

      let res;
      try {
        res = await request(
          "PUT",
          `${API_BASE}/api/admin/accounts/${encodeURIComponent(email)}/reset-password`,
          { newPassword },
          getAuthHeaders(token),
        );
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request(
          "PUT",
          `${API_BASE}/api/admin/accounts/${encodeURIComponent(email)}/reset-password`,
          { newPassword },
          getAuthHeaders(token),
        );
      }

      if (!res?.success) {
        showPopup({ status: "error", message: res?.message || "Reset mật khẩu thất bại." });
        return;
      }

      showPopup({ status: "success", message: res?.message || "Đã reset mật khẩu thành công." });
    } catch (error) {
      showPopup({ status: "error", message: error?.message || "Reset mật khẩu thất bại." });
    } finally {
      setResettingEmail("");
    }
  };

  const resetCreateForm = () => {
    setCreateAvatarUrlBroken(false);
    setCreateAccountForm({
      email: "",
      displayName: "",
      password: "",
      role: 0,
      avatarFile: null,
      avatarUrl: "",
    });
  };

  const openCreatePopup = () => {
    resetCreateForm();
    setShowCreatePopup(true);
  };

  const closeCreatePopup = () => {
    if (creatingAccount) return;
    setShowCreatePopup(false);
  };

  const handleChangeCreateField = (field, value) => {
    if (field === "avatarUrl") {
      setCreateAvatarUrlBroken(false);
    }
    setCreateAccountForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "avatarUrl" ? { avatarFile: null } : {}),
    }));
  };

  const handleCreateAvatarFile = (file) => {
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      showPopup({ status: "warning", message: "Vui lòng chọn đúng file ảnh avatar." });
      return;
    }

    setCreateAccountForm((prev) => ({
      ...prev,
      avatarFile: file,
      avatarUrl: "",
    }));
    setCreateAvatarUrlBroken(false);
  };

  const handleCreateAvatarPreviewLoad = () => {
    if (!String(createAccountForm.avatarUrl || "").trim()) return;
    showPopup({ status: "success", message: "Ảnh từ web tải được. Bấm tạo tài khoản để lưu ảnh." });
  };

  const handleCreateAvatarPreviewError = () => {
    if (!String(createAccountForm.avatarUrl || "").trim()) return;
    setCreateAvatarUrlBroken(true);
    showPopup({ status: "warning", message: "Không tải được ảnh từ URL này. Vui lòng kiểm tra lại đường dẫn ảnh." });
  };

  const handleEditAvatarPreviewLoad = () => {
    if (!String(editAccountForm.avatarUrl || "").trim()) return;
    showPopup({ status: "success", message: "Ảnh từ web tải được. Bấm lưu thay đổi để cập nhật ảnh." });
  };

  const handleEditAvatarPreviewError = () => {
    if (!String(editAccountForm.avatarUrl || "").trim()) return;
    setEditAvatarUrlBroken(true);
    showPopup({ status: "warning", message: "Không tải được ảnh từ URL này. Vui lòng kiểm tra lại đường dẫn ảnh." });
  };

  const handleCreateAvatarDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleCreateAvatarFile(file);
      return;
    }

    const droppedUrl = getDroppedImageUrl(event);
    if (droppedUrl) {
      setCreateAvatarUrlBroken(false);
      setCreateAccountForm((prev) => ({
        ...prev,
        avatarFile: null,
        avatarUrl: droppedUrl,
      }));
      showPopup({ status: "info", message: "Đã nhận ảnh từ web. Đang kiểm tra ảnh..." });
      return;
    }

    showPopup({ status: "warning", message: "Chỉ nhận file ảnh hoặc ảnh/link ảnh kéo từ web." });
  };

  const handleCreateAvatarDragOver = (event) => {
    event.preventDefault();
  };

  const handleCreateAccount = async () => {
    const email = String(createAccountForm.email || "").trim().toLowerCase();
    const avatarUrl = String(createAccountForm.avatarUrl || "").trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      showPopup({ status: "warning", message: "Email không hợp lệ." });
      return;
    }

    const displayName = String(createAccountForm.displayName || "").trim();
    const password = String(createAccountForm.password || "").trim();
    if (password.length < 6) {
      showPopup({ status: "warning", message: "Mật khẩu phải có ít nhất 6 ký tự." });
      return;
    }

    const role = Number(createAccountForm.role);
    if (role !== 0 && role !== 1) {
      showPopup({ status: "warning", message: "Role chỉ nhận 0 hoặc 1." });
      return;
    }

    if (avatarUrl && createAvatarUrlBroken) {
      showPopup({ status: "warning", message: "URL ảnh chưa tải được, vui lòng đổi URL khác trước khi tạo tài khoản." });
      return;
    }

    try {
      setCreatingAccount(true);
      let token = localStorage.getItem("accessToken");
      const payload = new FormData();
      payload.append("email", email);
      payload.append("displayName", displayName);
      payload.append("password", password);
      payload.append("role", String(role));
      payload.append("avatarUrl", avatarUrl);
      if (createAccountForm.avatarFile) {
        payload.append("avatarFile", createAccountForm.avatarFile);
      }

      let res;
      try {
        res = await request(
          "POST",
          `${API_BASE}/api/admin/accounts`,
          payload,
          getAuthHeaders(token),
        );
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request(
          "POST",
          `${API_BASE}/api/admin/accounts`,
          payload,
          getAuthHeaders(token),
        );
      }

      if (!res?.success) {
        showPopup({ status: "error", message: res?.message || "Tạo tài khoản thất bại." });
        return;
      }

      showPopup({
        status: "success",
        message: avatarUrl
          ? "Tạo tài khoản thành công. Ảnh từ web đã được tải và lưu vào hệ thống."
          : res?.message || "Tạo tài khoản thành công.",
      });
      setShowCreatePopup(false);
      resetCreateForm();
      await fetchAccounts();
    } catch (error) {
      showPopup({ status: "error", message: error?.message || "Tạo tài khoản thất bại." });
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleDeleteAccount = async (row) => {
    const email = getAccountEmail(row);
    if (!email) {
      showPopup({ status: "warning", message: "Khong tim thay email tai khoan de xoa." });
      return;
    }

    const confirmed = window.confirm(`Ban co chac muon xoa tai khoan ${email}?`);
    if (!confirmed) return;

    try {
      setDeletingEmail(email);
      let token = localStorage.getItem("accessToken");

      let res;
      try {
        res = await request(
          "DELETE",
          `${API_BASE}/api/admin/accounts/${encodeURIComponent(email)}`,
          null,
          getAuthHeaders(token),
        );
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request(
          "DELETE",
          `${API_BASE}/api/admin/accounts/${encodeURIComponent(email)}`,
          null,
          getAuthHeaders(token),
        );
      }

      if (!res?.success) {
        showPopup({ status: "error", message: res?.message || "Xoa tai khoan that bai." });
        return;
      }

      const deletedCurrentAccount = email.toLowerCase() === getCurrentUserEmail();
      if (deletedCurrentAccount) {
        showPopup({
          status: "success",
          message: "Tai khoan dang dang nhap da bi xoa. He thong se dang xuat.",
        });
        window.setTimeout(logoutDeletedCurrentAccount, 500);
        return;
      }

      showPopup({ status: "success", message: res?.message || "Xoa tai khoan thanh cong." });
      await fetchAccounts();
    } catch (error) {
      showPopup({ status: "error", message: error?.message || "Xoa tai khoan that bai." });
    } finally {
      setDeletingEmail("");
    }
  };

  const handleUpdateAccount = async () => {
    const email = String(editAccountForm.email || "").trim().toLowerCase();
    const displayName = String(editAccountForm.displayName || "").trim();
    const avatar = String(editAccountForm.avatar || "").trim();
    const role = Number(editAccountForm.role);
    const isActive = Number(editAccountForm.isActive);
    const avatarUrl = String(editAccountForm.avatarUrl || "").trim();

    if (!email) {
      showPopup({ status: "warning", message: "Khong tim thay email tai khoan de cap nhat." });
      return;
    }

    if (!displayName) {
      showPopup({ status: "warning", message: "Ten hien thi khong duoc de trong." });
      return;
    }

    if (role !== 0 && role !== 1) {
      showPopup({ status: "warning", message: "Vai tro khong hop le." });
      return;
    }

    if (isActive !== 0 && isActive !== 1) {
      showPopup({ status: "warning", message: "Trang thai khong hop le." });
      return;
    }

    if (avatarUrl && editAvatarUrlBroken) {
      showPopup({ status: "warning", message: "URL ảnh chưa tải được, vui lòng đổi URL khác trước khi lưu." });
      return;
    }

    try {
      setSavingEditAccount(true);
      let token = localStorage.getItem("accessToken");
      const payload = new FormData();
      payload.append("displayName", displayName);
      payload.append("avatar", avatar);
      payload.append("avatarUrl", avatarUrl);
      payload.append("role", String(role));
      payload.append("isActive", String(isActive));
      if (editAccountForm.avatarFile) {
        payload.append("avatarFile", editAccountForm.avatarFile);
      }

      let res;
      try {
        res = await request(
          "PUT",
          `${API_BASE}/api/admin/accounts/${encodeURIComponent(email)}`,
          payload,
          getAuthHeaders(token),
        );
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request(
          "PUT",
          `${API_BASE}/api/admin/accounts/${encodeURIComponent(email)}`,
          payload,
          getAuthHeaders(token),
        );
      }

      if (!res?.success) {
        showPopup({ status: "error", message: res?.message || "Cap nhat tai khoan that bai." });
        return;
      }

      if (email === getCurrentUserEmail()) {
        try {
          const currentUser = JSON.parse(localStorage.getItem("user") || "null");
          const savedAvatar = res?.avatar || avatar;
          localStorage.setItem("user", JSON.stringify({
            ...currentUser,
            name: displayName,
            displayName,
            avatar: savedAvatar,
            role,
          }));
        } catch (error) {}
      }

      showPopup({
        status: "success",
        message: avatarUrl
          ? "Cập nhật tài khoản thành công. Ảnh từ web đã được tải và lưu vào hệ thống."
          : res?.message || "Cap nhat tai khoan thanh cong.",
      });
      setShowEditPopup(false);
      await fetchAccounts();
    } catch (error) {
      showPopup({ status: "error", message: error?.message || "Cap nhat tai khoan that bai." });
    } finally {
      setSavingEditAccount(false);
    }
  };
  return (
    <div className="account-page">
      <Notification open={notify.open} status={notify.status} message={notify.message} onClose={closePopup} />
      <ToolBar
        title={TXT.title}
        onSearchChange={handleSearchChange}
      />

      <div className="account-container">
        <div className="account-summary-cards">
          <div className="summary-card">
            <div className="summary-label">Tổng tài khoản</div>
            <div className="summary-value">{dashboardStats.total}</div>
          </div>
          <div className="summary-card is-admin">
            <div className="summary-label">Admin</div>
            <div className="summary-value">{dashboardStats.adminCount}</div>
          </div>
          <div className="summary-card is-customer">
            <div className="summary-label">Khách hàng</div>
            <div className="summary-value">{dashboardStats.customerCount}</div>
          </div>
        </div>

        <div className="account-filter-row">
          <div className="account-role-filter">
            <button
              type="button"
              className={`filter-btn ${roleFilter === ROLE_FILTERS.ALL ? "active" : ""}`}
              onClick={() => setRoleFilter(ROLE_FILTERS.ALL)}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`filter-btn ${roleFilter === ROLE_FILTERS.ADMIN ? "active" : ""}`}
              onClick={() => setRoleFilter(ROLE_FILTERS.ADMIN)}
            >
              Admin
            </button>
            <button
              type="button"
              className={`filter-btn ${roleFilter === ROLE_FILTERS.CUSTOMER ? "active" : ""}`}
              onClick={() => setRoleFilter(ROLE_FILTERS.CUSTOMER)}
            >
              Khách hàng
            </button>
          </div>

          <div className="account-top-actions">
            <button
              type="button"
              className="btn-action create-account admin-create-btn"
              onClick={openCreatePopup}
              disabled={creatingAccount}
            >
              <span className="admin-create-btn__icon" />
              {creatingAccount ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
          </div>
        </div>

        <div className="account-list">
          {showLoading ? (
            <AdminLoadingScreen message={TXT.loading} compact />
          ) : filteredAccounts.length === 0 ? (
            <div className="no-data">{TXT.noData}</div>
          ) : (
            <table className="account-table" style={{ width: `${tableWidth}px` }}>
              <colgroup>
                {columns.map((column) => (
                  <col key={`col-${column}`} style={{ width: `${getColumnWidth(column)}px` }} />
                ))}
                <col style={{ width: `${ACTION_COLUMN_WIDTH}px` }} />
              </colgroup>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className={isRoleColumn(column) ? "th-role" : ""}
                      style={{
                        width: `${getColumnWidth(column)}px`,
                        minWidth: `${getColumnWidth(column)}px`,
                        maxWidth: `${getColumnWidth(column)}px`,
                      }}
                    >
                      {getColumnLabel(column)}
                    </th>
                  ))}
                  <th className="th-action">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((row, idx) => (
                  <tr
                    key={`${row?.Email || "account"}-${idx}`}
                    className="account-table-row"
                    style={{ animationDelay: `${Math.min(idx * 40, 520)}ms` }}
                    onClick={() => setDetailAccount(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setDetailAccount(row);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    title="Bấm để xem và chỉnh sửa tài khoản"
                  >
                    {columns.map((column) => (
                      <td
                        key={`${column}-${idx}`}
                        className={`${isAvatarColumn(column) ? "td-avatar" : ""} ${isRoleColumn(column) ? "td-role" : ""}`.trim()}
                        style={{
                          width: `${getColumnWidth(column)}px`,
                          minWidth: `${getColumnWidth(column)}px`,
                          maxWidth: `${getColumnWidth(column)}px`,
                        }}
                      >
                        {renderCellValue(row, column)}
                      </td>
                    ))}
                    <td className="td-action">
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-edit-account"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditPopup(row);
                          }}
                          disabled={savingEditAccount || deletingEmail === getAccountEmail(row)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn-reset-password"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleResetPassword(row);
                          }}
                          disabled={resettingEmail === getAccountEmail(row) || deletingEmail === getAccountEmail(row)}
                        >
                          {resettingEmail === getAccountEmail(row) ? "Đang reset..." : "Reset mật khẩu"}
                        </button>
                        <button
                          type="button"
                          className="btn-delete-account"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteAccount(row);
                          }}
                          disabled={deletingEmail === getAccountEmail(row) || resettingEmail === getAccountEmail(row)}
                          title="Xóa tài khoản"
                          aria-label="Xóa tài khoản"
                        >
                          -
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateAccountPopup
        open={showCreatePopup}
        isCreating={creatingAccount}
        form={createAccountForm}
        avatarPreviewUrl={createAvatarPreviewUrl}
        onClose={closeCreatePopup}
        onChangeField={handleChangeCreateField}
        onAvatarFile={handleCreateAvatarFile}
        onAvatarDrop={handleCreateAvatarDrop}
        onAvatarDragOver={handleCreateAvatarDragOver}
        onAvatarPreviewLoad={handleCreateAvatarPreviewLoad}
        onAvatarPreviewError={handleCreateAvatarPreviewError}
        onSubmit={handleCreateAccount}
      />

      {showEditPopup ? (
        <div className="account-create-popup-overlay" role="dialog" aria-modal="true">
          <div className="account-create-popup account-edit-popup">
            <div className="account-create-popup-head">
              <div>
                <h3 className="account-create-popup-title">Sửa tài khoản</h3>
                <p className="account-create-popup-subtitle">
                  Cập nhật thông tin đăng nhập và trạng thái tài khoản.
                </p>
              </div>
              <button
                type="button"
                className="account-create-popup-close"
                onClick={closeEditPopup}
                disabled={savingEditAccount}
                aria-label="Đóng form sửa tài khoản"
              >
                x
              </button>
            </div>

            <div className="account-create-form">
              <div className="account-create-field account-create-field-full">
                <label>Email</label>
                <input value={editAccountForm.email} disabled />
              </div>

              <div className="account-create-field">
                <label>Tên hiển thị</label>
                <input
                  value={editAccountForm.displayName}
                  onChange={(event) => handleChangeEditField("displayName", event.target.value)}
                  placeholder="Nhập tên hiển thị"
                  disabled={savingEditAccount}
                />
              </div>

              <div className="account-create-field">
                <label>Vai trò</label>
                <select
                  value={editAccountForm.role}
                  onChange={(event) => handleChangeEditField("role", Number(event.target.value))}
                  disabled={savingEditAccount}
                >
                  <option value={0}>Khách hàng</option>
                  <option value={1}>Admin</option>
                </select>
              </div>

              <div className="account-create-field">
                <label>Trạng thái</label>
                <select
                  value={editAccountForm.isActive}
                  onChange={(event) => handleChangeEditField("isActive", Number(event.target.value))}
                  disabled={savingEditAccount}
                >
                  <option value={1}>Hoạt động</option>
                  <option value={0}>Tạm dừng</option>
                </select>
              </div>

              <div className="account-edit-avatar account-create-field-full">
                <label
                  className="account-edit-avatar__picker"
                  onDrop={handleEditAvatarDrop}
                  onDragOver={handleEditAvatarDragOver}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleEditAvatarFile(event.target.files?.[0])}
                    disabled={savingEditAccount}
                  />
                  <span className="account-edit-avatar__preview">
                    {editAvatarPreviewUrl ? (
                      <img
                        src={editAvatarPreviewUrl}
                        alt={editAccountForm.displayName || editAccountForm.email || "avatar"}
                        onLoad={handleEditAvatarPreviewLoad}
                        onError={handleEditAvatarPreviewError}
                      />
                    ) : (
                      <span>{String(editAccountForm.displayName || editAccountForm.email || "?").charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  <span className="account-edit-avatar__caption">
                    {editAccountForm.avatarFile ? `Đã chọn: ${editAccountForm.avatarFile.name}` : "Bấm hoặc kéo ảnh mới vào đây để thay đổi"}
                  </span>
                </label>
              </div>
              <div className="account-create-field account-create-field-full">
                <label htmlFor="account-edit-avatar-url">Ảnh từ web</label>
                <input
                  id="account-edit-avatar-url"
                  type="url"
                  value={editAccountForm.avatarUrl || ""}
                  onChange={(event) => handleChangeEditField("avatarUrl", event.target.value)}
                  placeholder="https://example.com/avatar.png"
                  disabled={savingEditAccount}
                />
              </div>
              <div className="account-create-hint">
                Email không chỉnh trực tiếp để tránh lệch dữ liệu đăng nhập.
              </div>

              <div className="account-create-actions account-create-field-full">
                <button type="button" className="btn-cancel" onClick={closeEditPopup} disabled={savingEditAccount}>
                  Hủy
                </button>
                <button type="button" className="btn-confirm" onClick={handleUpdateAccount} disabled={savingEditAccount}>
                  {savingEditAccount ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {detailAccount ? (
        <div className="account-detail-overlay" role="dialog" aria-modal="true">
          <div className="account-detail-popup">
            <button
              type="button"
              className="account-detail-close"
              onClick={closeDetailPopup}
              aria-label="Đóng chi tiết tài khoản"
            >
              x
            </button>

            <div className="account-detail-hero">
              <div className="account-detail-avatar">
                {resolveAvatarSrc(detailAccount.Avatar || detailAccount.avatar) ? (
                  <img
                    src={resolveAvatarSrc(detailAccount.Avatar || detailAccount.avatar)}
                    alt={detailAccount.DisplayName || detailAccount.Email || "avatar"}
                  />
                ) : (
                  <span>{String(detailAccount.DisplayName || detailAccount.Email || "?").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <h2>{detailAccount.DisplayName || detailAccount.Email || "Tài khoản"}</h2>
            </div>

            <div className="account-detail-grid">
              {columns
                .filter((column) => !/password/i.test(column))
                .map((column) => (
                  <div
                    key={`detail-${column}`}
                    className={`account-detail-item ${isAvatarColumn(column) ? "account-detail-item--avatar" : ""}`}
                  >
                    <span>{getColumnLabel(column)}</span>
                    {isAvatarColumn(column) ? (
                      resolveAvatarSrc(detailAccount[column]) ? (
                        <img src={resolveAvatarSrc(detailAccount[column])} alt="avatar" />
                      ) : (
                        <strong>-</strong>
                      )
                    ) : String(column).toLowerCase() === "role" ? (
                      <strong>{getRoleMeta(detailAccount[column]).label}</strong>
                    ) : String(column).toLowerCase() === "isactive" ? (
                      <strong>{getActiveMeta(detailAccount[column]).label}</strong>
                    ) : (
                      <strong>{formatDetailValue(detailAccount[column], column)}</strong>
                    )}
                  </div>
                ))}
            </div>

            <div className="account-detail-actions">
              <button type="button" className="btn-detail-secondary" onClick={closeDetailPopup}>
                Đóng
              </button>
              <button
                type="button"
                className="btn-detail-edit"
                onClick={openEditFromDetail}
                disabled={savingEditAccount || deletingEmail === getAccountEmail(detailAccount)}
              >
                Sửa tài khoản
              </button>
              <button
                type="button"
                className="btn-detail-primary"
                onClick={() => handleResetPassword(detailAccount)}
                disabled={resettingEmail === getAccountEmail(detailAccount)}
              >
                {resettingEmail === getAccountEmail(detailAccount) ? "Đang reset..." : "Reset mật khẩu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AccountPage;
