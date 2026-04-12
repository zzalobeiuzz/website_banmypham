import React, { useEffect, useMemo, useState } from "react";
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
const ACTION_COLUMN_WIDTH = 250;

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

const resolveAvatarSrc = (avatarValue) => {
  const value = String(avatarValue || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  const normalized = value.replace(/^\/+/, "").replace(/^uploads\/assets\/?/i, "");
  return `${UPLOAD_BASE}/${normalized}`;
};

const AccountPage = () => {
  const { request } = useHttp();
  const [accounts, setAccounts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState(ROLE_FILTERS.ALL);
  const [resettingEmail, setResettingEmail] = useState("");
  const [deletingEmail, setDeletingEmail] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [createAccountForm, setCreateAccountForm] = useState({
    email: "",
    displayName: "",
    password: "",
    role: 0,
  });
  const [loading, setLoading] = useState(false);
  const showLoading = useMinimumLoading(loading, 500);
  const [notify, setNotify] = useState({ open: false, status: "info", message: "" });

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
    setCreateAccountForm({
      email: "",
      displayName: "",
      password: "",
      role: 0,
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
    setCreateAccountForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAccount = async () => {
    const email = String(createAccountForm.email || "").trim().toLowerCase();
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

    try {
      setCreatingAccount(true);
      let token = localStorage.getItem("accessToken");

      let res;
      try {
        res = await request(
          "POST",
          `${API_BASE}/api/admin/accounts`,
          { email, displayName, password, role },
          getAuthHeaders(token),
        );
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request(
          "POST",
          `${API_BASE}/api/admin/accounts`,
          { email, displayName, password, role },
          getAuthHeaders(token),
        );
      }

      if (!res?.success) {
        showPopup({ status: "error", message: res?.message || "Tạo tài khoản thất bại." });
        return;
      }

      showPopup({ status: "success", message: res?.message || "Tạo tài khoản thành công." });
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
      showPopup({ status: "warning", message: "Không tìm thấy email tài khoản để xóa." });
      return;
    }

    const confirmed = window.confirm(`Bạn có chắc muốn xóa tài khoản ${email}?`);
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
        showPopup({ status: "error", message: res?.message || "Xóa tài khoản thất bại." });
        return;
      }

      showPopup({ status: "success", message: res?.message || "Xóa tài khoản thành công." });
      await fetchAccounts();
    } catch (error) {
      showPopup({ status: "error", message: error?.message || "Xóa tài khoản thất bại." });
    } finally {
      setDeletingEmail("");
    }
  };

  return (
    <div className="account-page">
      <div className="account-bg-orb orb-one" />
      <div className="account-bg-orb orb-two" />
      <div className="account-bg-grid" />
      <Notification open={notify.open} status={notify.status} message={notify.message} onClose={closePopup} />
      <ToolBar title={TXT.title} onSearchChange={handleSearchChange} />

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

        <div className="account-top-actions">
          <button
            type="button"
            className="btn-action create-account"
            onClick={openCreatePopup}
            disabled={creatingAccount}
          >
            {creatingAccount ? "Đang tạo..." : "+ Tạo tài khoản"}
          </button>
        </div>

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
                          className="btn-reset-password"
                          onClick={() => handleResetPassword(row)}
                          disabled={resettingEmail === getAccountEmail(row) || deletingEmail === getAccountEmail(row)}
                        >
                          {resettingEmail === getAccountEmail(row) ? "Đang reset..." : "Reset mật khẩu"}
                        </button>
                        <button
                          type="button"
                          className="btn-delete-account"
                          onClick={() => handleDeleteAccount(row)}
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
        onClose={closeCreatePopup}
        onChangeField={handleChangeCreateField}
        onSubmit={handleCreateAccount}
      />
    </div>
  );
};

export default AccountPage;
