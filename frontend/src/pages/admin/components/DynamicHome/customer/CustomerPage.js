import React, { useEffect, useState } from "react";
import useHttp from "../../../../../hooks/useHttp";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import ToolBar from "../../ToolBar";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import Notification from "../../shared/Notification";
import useMinimumLoading from "../../useMinimumLoading";
import "./style.scss";

const TXT = {
  title: "Quản lý khách hàng",
  searchPlaceholder:
    "Tìm theo mã KH, tên, email, số điện thoại...",
  loading: "Đang tải...",
  noData: "Không có khách hàng nào",
  noAccount:
    "Khách hàng này chưa có tài khoản đăng nhập",
};

const CustomerPage = () => {
  const { request } = useHttp();

  const [customers, setCustomers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const showLoading = useMinimumLoading(loading, 500);
  const [customerDetail, setCustomerDetail] = useState(null);

  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState("");
  const [showResetPasswordPopup, setShowResetPasswordPopup] = useState(false);
  const [newResetPassword, setNewResetPassword] = useState("");

  const [activeDetailTab, setActiveDetailTab] = useState("info");
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [showUpdateConfirmPopup, setShowUpdateConfirmPopup] = useState(false);
  const [showUpdateSuccessPopup, setShowUpdateSuccessPopup] = useState(false);
  const [notify, setNotify] = useState({ open: false, status: "info", message: "" });
  const [editForm, setEditForm] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
  });

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

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let token = localStorage.getItem("accessToken");

      let res;
      try {
        res = await request("GET", `${API_BASE}/api/admin/customers`, null, getAuthHeaders(token));
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request("GET", `${API_BASE}/api/admin/customers`, null, getAuthHeaders(token));
      }

      if (res?.success) setCustomers(res.data || []);
    } catch (error) {
      console.error("Loi:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetail = async (customerId) => {
    try {
      setLoading(true);
      let token = localStorage.getItem("accessToken");

      let res;
      try {
        res = await request("GET", `${API_BASE}/api/admin/customers/${customerId}`, null, getAuthHeaders(token));
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request("GET", `${API_BASE}/api/admin/customers/${customerId}`, null, getAuthHeaders(token));
      }

      if (res?.success) {
        const detailData = res.data || null;
        setCustomerDetail(detailData);
        setEditForm({
          fullName: detailData?.FullName || "",
          phoneNumber: detailData?.PhoneNumber || "",
          address: detailData?.Address || "",
        });
        setIsEditingCustomer(false);
        setIsSavingCustomer(false);
        setEditMessage("");
        setResetPasswordMessage("");
        setActiveDetailTab("info");
        setShowDetailPopup(true);
      }
    } catch (error) {
      console.error("Loi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const isActive =
      customer?.IsActive === null ||
      customer?.IsActive === undefined ||
      Number(customer?.IsActive) === 1;
    if (!isActive) return false;

    const keyword = searchKeyword.toLowerCase();
    return (
      customer.FullName?.toLowerCase().includes(keyword) ||
      String(customer.CustomerCode || "").toLowerCase().includes(keyword) ||
      customer.CustomerID?.toLowerCase().includes(keyword) ||
      customer.Email?.toLowerCase().includes(keyword) ||
      customer.PhoneNumber?.includes(keyword) ||
      customer.AccountEmail?.toLowerCase().includes(keyword) ||
      customer.DisplayName?.toLowerCase().includes(keyword)
    );
  });

  const formatPrice = (price) => {
    if (!price) return "0 ₫";
    const num = typeof price === "string" ? parseFloat(price) : price;
    return `${Math.round(num).toLocaleString("vi-VN")} ₫`;
  };

  const resolveAvatarSrc = (avatar) => {
    if (!avatar) return "";
    const value = String(avatar).trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
    const normalized = value.replace(/^\/+/, "").replace(/^uploads\/?assets\/?/i, "");
    return `${UPLOAD_BASE}/${normalized}`;
  };

  const isAccountCustomer = (customer) => Boolean(customer?.HasAccount || customer?.AccountEmail);
  const getAccountStatusLabel = (customer) => {
    if (customer?.AccountStatus) return customer.AccountStatus;
    return isAccountCustomer(customer) ? "Đã có" : "Không có";
  };

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

  const handleResetPassword = async () => {
    if (!customerDetail?.AccountEmail) {
      setResetPasswordMessage("Khách hàng này chưa có tài khoản đăng nhập.");
      return;
    }

    const normalizedNewPassword = String(newResetPassword || "").trim();
    if (!normalizedNewPassword) {
      setResetPasswordMessage("Vui lòng nhập mật khẩu mới để reset.");
      return;
    }
    if (normalizedNewPassword.length < 6) {
      setResetPasswordMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setIsResettingPassword(true);
      setResetPasswordMessage("");

      let token = localStorage.getItem("accessToken");
      let res;
      try {
        res = await request(
          "PUT",
          `${API_BASE}/api/admin/customers/${encodeURIComponent(customerDetail.CustomerID)}/reset-password`,
          { newPassword: normalizedNewPassword },
          getAuthHeaders(token)
        );
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request(
          "PUT",
          `${API_BASE}/api/admin/customers/${encodeURIComponent(customerDetail.CustomerID)}/reset-password`,
          { newPassword: normalizedNewPassword },
          getAuthHeaders(token)
        );
      }

      if (!res?.success) {
        setResetPasswordMessage(res?.message || "Reset mật khẩu thất bại.");
        return;
      }

      setResetPasswordMessage("Đã reset mật khẩu thành công.");
      setShowResetPasswordPopup(false);
      setNewResetPassword("");
    } catch (error) {
      setResetPasswordMessage(error?.message || "Reset mật khẩu thất bại.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const closeDetailPopup = () => {
    setShowDetailPopup(false);
    setResetPasswordMessage("");
    setShowResetPasswordPopup(false);
    setShowUpdateConfirmPopup(false);
    setShowUpdateSuccessPopup(false);
    setNewResetPassword("");
    setIsEditingCustomer(false);
    setIsSavingCustomer(false);
    setEditMessage("");
    setActiveDetailTab("info");
  };

  const openResetPasswordPopup = () => {
    setResetPasswordMessage("");
    setNewResetPassword("");
    setShowResetPasswordPopup(true);
  };

  const closeResetPasswordPopup = () => {
    if (isResettingPassword) return;
    setShowResetPasswordPopup(false);
    setNewResetPassword("");
  };

  const closeUpdateSuccessPopup = () => {
    setShowUpdateSuccessPopup(false);
  };

  const openUpdateConfirmPopup = () => {
    if (isSavingCustomer) return;
    setEditMessage("");
    setShowUpdateConfirmPopup(true);
  };

  const closeUpdateConfirmPopup = () => {
    if (isSavingCustomer) return;
    setShowUpdateConfirmPopup(false);
  };

  const openEditCustomerMode = () => {
    setEditMessage("");
    setIsEditingCustomer(true);
    setEditForm({
      fullName: customerDetail?.FullName || "",
      phoneNumber: customerDetail?.PhoneNumber || "",
      address: customerDetail?.Address || "",
    });
  };

  const cancelEditCustomerMode = () => {
    if (isSavingCustomer) return;
    setIsEditingCustomer(false);
    setEditMessage("");
    setEditForm({
      fullName: customerDetail?.FullName || "",
      phoneNumber: customerDetail?.PhoneNumber || "",
      address: customerDetail?.Address || "",
    });
  };

  const handleChangeEditForm = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCustomerInfo = async () => {
    setShowUpdateConfirmPopup(false);
    const fullName = String(editForm.fullName || "").trim();
    const phoneNumber = String(editForm.phoneNumber || "").trim();
    const address = String(editForm.address || "").trim();

    if (!fullName) return setEditMessage("Tên khách hàng không được để trống.");
    if (!phoneNumber) return setEditMessage("Số điện thoại không được để trống.");
    if (!address) return setEditMessage("Địa chỉ không được để trống.");

    try {
      setIsSavingCustomer(true);
      setEditMessage("");

      let token = localStorage.getItem("accessToken");
      let res;
      try {
        res = await request(
          "PUT",
          `${API_BASE}/api/admin/customers/${encodeURIComponent(customerDetail.CustomerID)}`,
          { fullName, phoneNumber, address },
          getAuthHeaders(token)
        );
      } catch (error) {
        if (error?.status !== 401) throw error;
        token = await refreshAccessToken();
        res = await request(
          "PUT",
          `${API_BASE}/api/admin/customers/${encodeURIComponent(customerDetail.CustomerID)}`,
          { fullName, phoneNumber, address },
          getAuthHeaders(token)
        );
      }

      if (!res?.success) {
        showPopup({ status: "error", message: res?.message || "Cập nhật thông tin thất bại." });
        return;
      }

      const latestCustomer = res?.data || {
        ...customerDetail,
        FullName: fullName,
        PhoneNumber: phoneNumber,
        Address: address,
      };

      setCustomerDetail(latestCustomer);
      setEditForm({
        fullName: latestCustomer?.FullName || fullName,
        phoneNumber: latestCustomer?.PhoneNumber || phoneNumber,
        address: latestCustomer?.Address || address,
      });
      setEditMessage("");
      setShowUpdateSuccessPopup(true);
      setIsEditingCustomer(false);
      await fetchCustomers();
    } catch (error) {
      showPopup({ status: "error", message: error?.message || "Cập nhật thông tin thất bại." });
    } finally {
      setIsSavingCustomer(false);
    }
  };

  return (
    <div className="customer-page">
      <Notification
        open={notify.open}
        status={notify.status}
        message={notify.message}
        onClose={closePopup}
      />
      <ToolBar title={TXT.title} />
      <div className="customer-container">
        <div className="search-section">
          <input
            type="text"
            placeholder={TXT.searchPlaceholder}
            className="search-input"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <div className="customer-list">
          {showLoading ? (
            <AdminLoadingScreen message={TXT.loading} compact />
          ) : filteredCustomers.length === 0 ? (
            <div className="no-data">{TXT.noData}</div>
          ) : (
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Mã khách hàng</th>
                  <th>Ảnh đại diện</th>
                  <th>Tên khách hàng</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Trạng thái tài khoản</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, idx) => (
                  <tr key={idx} className="customer-row">
                    <td className="td-customer-code cell-wrap">
                      <span className="customer-code-field">{customer.CustomerCode ?? "N/A"}</span>
                    </td>
                    <td className="td-avatar">
                      {customer.Avatar && (
                        <img src={resolveAvatarSrc(customer.Avatar)} alt="avatar" className="avatar-thumb" />
                      )}
                    </td>
                    <td className="td-full-name cell-wrap">
                      <span className="customer-field-text">{customer.FullName || "N/A"}</span>
                    </td>
                    <td className="td-email cell-wrap">
                      <span className="customer-field-text">{customer.Email || customer.CustomerID || "N/A"}</span>
                    </td>
                    <td className="td-phone cell-wrap">
                      <span className="customer-field-text">{customer.PhoneNumber || "N/A"}</span>
                    </td>
                    <td className="td-account-status cell-wrap">
                      <span className="customer-field-text">
                        <span className={`type-badge ${isAccountCustomer(customer) ? "account" : "guest"}`}>
                          {getAccountStatusLabel(customer)}
                        </span>
                      </span>
                    </td>
                    <td className="actions-cell td-actions">
                      <button className="btn-action detail" onClick={() => fetchCustomerDetail(customer.CustomerID)}>
                        {"Chi tiết"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showDetailPopup && customerDetail && (
        <div className="detail-popup-overlay" onClick={closeDetailPopup}>
          <div className="detail-popup-shell" onClick={(e) => e.stopPropagation()}>
            <div className="detail-popup">
              <div className="popup-header">
                <h2>{"Chi tiết khách hàng"}</h2>
                <button className="close-btn" onClick={closeDetailPopup}>×</button>
              </div>

              <div className="popup-body">
                <div className="info-section">
                  {customerDetail.AccountEmail ? (
                    <div className="account-detail-card">
                      {customerDetail.Avatar && (
                        <img src={resolveAvatarSrc(customerDetail.Avatar)} alt="avatar" className="account-detail-avatar" />
                      )}
                      <div className="account-detail-info">
                        <div className="account-detail-name">{customerDetail.DisplayName || customerDetail.AccountEmail}</div>
                        <div className="account-detail-email">{customerDetail.AccountEmail}</div>
                        <div className="account-detail-role">
                          {"Vai trò: "}
                          {customerDetail.Role === 0
                            ? "Khách hàng"
                            : customerDetail.Role ?? "N/A"}
                        </div>
                      </div>
                      <div className="account-action-wrap">
                        <button className="btn-action reset-password" onClick={openResetPasswordPopup} disabled={isResettingPassword}>
                          {isResettingPassword
                            ? "Đang reset..."
                            : "Reset mật khẩu"}
                        </button>
                        <div className="account-action-note">
                          {"Nhập mật khẩu mới khi xác nhận reset."}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-account">{TXT.noAccount}</div>
                  )}

                  {resetPasswordMessage && <div className="reset-password-message">{resetPasswordMessage}</div>}
                </div>

                {activeDetailTab === "info" && (
                  <div className="info-section">
                    <h3>{"Thông tin cơ bản"}</h3>
                    <div className="info-actions">
                      {!isEditingCustomer ? (
                        <button className="btn-action edit" onClick={openEditCustomerMode}>
                          {"Chỉnh sửa"}
                        </button>
                      ) : (
                        <>
                          <button className="btn-action save" onClick={openUpdateConfirmPopup} disabled={isSavingCustomer}>
                            {isSavingCustomer ? "Đang lưu..." : "Lưu"}
                          </button>
                          <button className="btn-action cancel" onClick={cancelEditCustomerMode} disabled={isSavingCustomer}>
                            {"Hủy"}
                          </button>
                        </>
                      )}
                    </div>

                    <div className="info-grid">
                      <div className="info-item">
                        <label>{"Tên:"}</label>
                        {isEditingCustomer ? (
                          <input type="text" value={editForm.fullName} onChange={(e) => handleChangeEditForm("fullName", e.target.value)} disabled={isSavingCustomer} />
                        ) : (
                          <span className="editable-value">{customerDetail.FullName || "N/A"}</span>
                        )}
                      </div>
                      <div className="info-item">
                        <label>{"Điện thoại:"}</label>
                        {isEditingCustomer ? (
                          <input type="text" value={editForm.phoneNumber} onChange={(e) => handleChangeEditForm("phoneNumber", e.target.value)} disabled={isSavingCustomer} />
                        ) : (
                          <span className="editable-value">{customerDetail.PhoneNumber || "N/A"}</span>
                        )}
                      </div>
                      <div className="info-item">
                        <label>{"Địa chỉ:"}</label>
                        {isEditingCustomer ? (
                          <input type="text" value={editForm.address} onChange={(e) => handleChangeEditForm("address", e.target.value)} disabled={isSavingCustomer} />
                        ) : (
                          <span className="editable-value">{customerDetail.Address || "N/A"}</span>
                        )}
                      </div>
                      <div className="info-item"><label>Email / ID:</label><span className="editable-value">{customerDetail.CustomerID || "N/A"}</span></div>
                      <div className="info-item">
                        <label>{"Số đơn hàng đã mua:"}</label>
                        <span className="editable-value">{customerDetail.OrderCount ?? customerDetail.Orders?.length ?? 0}</span>
                      </div>
                      <div className="info-item">
                        <label>{"Tổng chi tiêu:"}</label>
                        <span className="total-spent">{formatPrice(customerDetail.TotalSpent)}</span>
                      </div>
                    </div>
                    {editMessage && <div className="edit-message">{editMessage}</div>}
                  </div>
                )}

                {activeDetailTab === "orders" && (
                  <div className="orders-section">
                    <h3>
                      {"Lịch sử đơn hàng"} ({customerDetail.OrderCount || 0})
                    </h3>
                    {customerDetail.Orders && customerDetail.Orders.length > 0 ? (
                      <div className="orders-table">
                        <table>
                          <thead>
                            <tr>
                              <th>{"Mã đơn"}</th>
                              <th>{"Ngày đặt"}</th>
                              <th>{"Tổng tiền"}</th>
                              <th>{"Trạng thái"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerDetail.Orders.map((order, idx) => (
                              <tr key={idx}>
                                <td>{order.OrderID || "N/A"}</td>
                                <td>{order.OrderDate ? new Date(order.OrderDate).toLocaleDateString("vi-VN") : "N/A"}</td>
                                <td className="price-cell">{formatPrice(order.TotalPrice)}</td>
                                <td>
                                  <span className={`status-badge ${order.Status?.toLowerCase() || ""}`}>
                                    {order.Status || "Chờ xác nhận"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="no-orders">{"Chưa có đơn hàng"}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={`popup-side-tabs outside ${activeDetailTab === "info" ? "tab-info" : "tab-orders"}`}>
              <button type="button" className={`side-tab-btn ${activeDetailTab === "info" ? "active" : ""}`} onClick={() => setActiveDetailTab("info")}>
                {"Thông tin"}
              </button>
              <button type="button" className={`side-tab-btn ${activeDetailTab === "orders" ? "active" : ""}`} onClick={() => setActiveDetailTab("orders")}>
                {"Lịch sử mua hàng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetPasswordPopup && (
        <div className="confirm-popup-overlay" onClick={closeResetPasswordPopup}>
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-popup-title">{"Xác nhận reset mật khẩu"}</div>
            <div className="confirm-popup-desc">{"Bạn có chắc muốn reset mật khẩu cho tài khoản này không?"}</div>
            <div className="confirm-popup-field">
              <label>{"Mật khẩu mới"}</label>
              <input
                type="password"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                placeholder={"Nhập mật khẩu mới (ít nhất 6 ký tự)"}
                disabled={isResettingPassword}
              />
            </div>
            <div className="confirm-popup-actions">
              <button type="button" className="btn-cancel" onClick={closeResetPasswordPopup} disabled={isResettingPassword}>
                {"Hủy"}
              </button>
              <button type="button" className="btn-confirm" onClick={handleResetPassword} disabled={isResettingPassword}>
                {isResettingPassword ? "Đang xử lý..." : "Xác nhận reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateConfirmPopup && (
        <div className="confirm-popup-overlay" onClick={closeUpdateConfirmPopup}>
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-popup-title">{"Xác nhận chỉnh sửa"}</div>
            <div className="confirm-popup-desc">{"Bạn có chắc muốn lưu thay đổi thông tin khách hàng không?"}</div>
            <div className="confirm-popup-actions">
              <button type="button" className="btn-cancel" onClick={closeUpdateConfirmPopup} disabled={isSavingCustomer}>
                {"Hủy"}
              </button>
              <button type="button" className="btn-confirm" onClick={handleSaveCustomerInfo} disabled={isSavingCustomer}>
                {isSavingCustomer ? "Đang lưu..." : "Xác nhận lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateSuccessPopup && (
        <div className="confirm-popup-overlay" onClick={closeUpdateSuccessPopup}>
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-popup-title">{"Cập nhật thành công"}</div>
            <div className="confirm-popup-desc">{"Thông tin khách hàng đã được cập nhật thành công."}</div>
            <div className="confirm-popup-actions">
              <button type="button" className="btn-ok" onClick={closeUpdateSuccessPopup}>
                {"Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPage;
