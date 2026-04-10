import React, { useEffect, useMemo, useState } from "react";
import useHttp from "../../../../../hooks/useHttp";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import ToolBar from "../../ToolBar";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import Notification from "../../shared/Notification";
import useMinimumLoading from "../../useMinimumLoading";
import "./style.scss";

const TXT = {
  title: "Quản lý tài khoản",
  searchPlaceholder: "Tìm theo bất kỳ cột nào trong ACCOUNT...",
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

const DEFAULT_COLUMN_WIDTH = 180;
const ACTION_COLUMN_WIDTH = 160;

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

const isAvatarColumn = (column) => String(column || "").toLowerCase().includes("avatar");

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
    const roleFiltered = accounts.filter((row) => {
      const role = Number(row?.Role);
      if (roleFilter === ROLE_FILTERS.ADMIN) return role === 1;
      if (roleFilter === ROLE_FILTERS.CUSTOMER) return role === 0;
      return true;
    });

    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return roleFiltered;

    return roleFiltered.filter((row) =>
      columns.some((column) => normalizeValue(row?.[column], column).toLowerCase().includes(keyword)),
    );
  }, [accounts, columns, roleFilter, searchKeyword]);

  const tableWidth = useMemo(() => {
    const dataColumnsWidth = columns.reduce((sum, column) => sum + getColumnWidth(column), 0);
    return dataColumnsWidth + ACTION_COLUMN_WIDTH;
  }, [columns]);

  const renderCellValue = (row, column) => {
    const rawValue = row?.[column];
    if (isAvatarColumn(column)) {
      const src = resolveAvatarSrc(rawValue);
      if (!src) return "-";
      return <img src={src} alt="avatar" className="account-avatar-thumb" />;
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

  return (
    <div className="account-page">
      <Notification open={notify.open} status={notify.status} message={notify.message} onClose={closePopup} />
      <ToolBar title={TXT.title} />

      <div className="account-container">
        <div className="account-search">
          <input
            type="text"
            placeholder={TXT.searchPlaceholder}
            className="search-input"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
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
            Admin (role 1)
          </button>
          <button
            type="button"
            className={`filter-btn ${roleFilter === ROLE_FILTERS.CUSTOMER ? "active" : ""}`}
            onClick={() => setRoleFilter(ROLE_FILTERS.CUSTOMER)}
          >
            Khách hàng (role 0)
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
                      style={{
                        width: `${getColumnWidth(column)}px`,
                        minWidth: `${getColumnWidth(column)}px`,
                        maxWidth: `${getColumnWidth(column)}px`,
                      }}
                    >
                      {column}
                    </th>
                  ))}
                  <th className="th-action">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((row, idx) => (
                  <tr key={`${row?.Email || "account"}-${idx}`}>
                    {columns.map((column) => (
                      <td
                        key={`${column}-${idx}`}
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
                      <button
                        type="button"
                        className="btn-reset-password"
                        onClick={() => handleResetPassword(row)}
                        disabled={resettingEmail === getAccountEmail(row)}
                      >
                        {resettingEmail === getAccountEmail(row) ? "Đang reset..." : "Reset mật khẩu"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
