import React, { useState, useEffect } from "react";
import useHttp from "../../../../../hooks/useHttp";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import ToolBar from "../../ToolBar";
import "./style.scss";

const CustomerPage = () => {
  const { request } = useHttp();
  const [customers, setCustomers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerDetail, setCustomerDetail] = useState(null);

  const getAuthHeaders = (token) => ({
    Authorization: `Bearer ${token}`,
  });

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

  // Lấy danh sách khách hàng
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

      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy chi tiết khách hàng
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

      if (res.success) {
        setCustomerDetail(res.data);
        setShowDetailPopup(true);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load danh sách khi mount
  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lọc khách hàng
  const filteredCustomers = customers.filter((customer) => {
    const isActive = customer?.IsActive === null || customer?.IsActive === undefined || Number(customer?.IsActive) === 1;
    if (!isActive) return false;

    const keyword = searchKeyword.toLowerCase();
    return (
      (customer.FullName && customer.FullName.toLowerCase().includes(keyword)) ||
      (String(customer.CustomerCode || "").toLowerCase().includes(keyword)) ||
      (customer.CustomerID && customer.CustomerID.toLowerCase().includes(keyword)) ||
      (customer.Email && customer.Email.toLowerCase().includes(keyword)) ||
      (customer.PhoneNumber && customer.PhoneNumber.includes(keyword)) ||
      (customer.AccountEmail && customer.AccountEmail.toLowerCase().includes(keyword)) ||
      (customer.DisplayName && customer.DisplayName.toLowerCase().includes(keyword))
    );
  });

  // Format tiền
  const formatPrice = (price) => {
    if (!price) return "0 ₫";
    const num = typeof price === "string" ? parseFloat(price) : price;
    return `${Math.round(num).toLocaleString("vi-VN")} ₫`;
  };

  const resolveAvatarSrc = (avatar) => {
    if (!avatar) return "";

    const value = String(avatar).trim();
    if (!value) return "";

    // Nếu DB đã lưu URL đầy đủ thì dùng luôn.
    if (/^https?:\/\//i.test(value) || value.startsWith("data:")) {
      return value;
    }

    // Chuẩn hóa về dạng path tương đối sau uploads/assets.
    const normalized = value
      .replace(/^\/+/, "")
      .replace(/^uploads\/?assets\/?/i, "");

    return `${UPLOAD_BASE}/${normalized}`;
  };

  const isAccountCustomer = (customer) => Boolean(customer?.HasAccount || customer?.AccountEmail);

  const getCustomerTypeLabel = (customer) => {
    if (isAccountCustomer(customer)) return "Tài khoản";
    if (customer?.Type === "Customer") return "Khách hàng";
    return "Khách lẻ";
  };

  const getAccountStatusLabel = (customer) => {
    if (customer?.AccountStatus) return customer.AccountStatus;
    return isAccountCustomer(customer) ? "Đã có" : "Không có";
  };

  return (
    <div className="customer-page">
      <ToolBar title="Quản lý khách hàng" />
      <div className="customer-container">
        <div className="search-section">
          <input
            type="text"
            placeholder="Tìm theo mã KH, tên, email, số điện thoại..."
            className="search-input"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <div className="customer-list">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="no-data">Không có khách hàng nào</div>
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
                        <img
                          src={resolveAvatarSrc(customer.Avatar)}
                          alt="avatar"
                          className="avatar-thumb"
                        />
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
                      <button
                        className="btn-action detail"
                        onClick={() => fetchCustomerDetail(customer.CustomerID)}
                      >
                        Chi tiết
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
        <div className="detail-popup-overlay" onClick={() => setShowDetailPopup(false)}>
          <div className="detail-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Chi tiết khách hàng</h2>
              <button className="close-btn" onClick={() => setShowDetailPopup(false)}>
                ×
              </button>
            </div>

            <div className="popup-body">
              <div className="info-section">
                <h3>Thông tin cơ bản</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Tên:</label>
                    <span>{customerDetail.FullName || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <label>Email / ID:</label>
                    <span>{customerDetail.CustomerID}</span>
                  </div>
                  <div className="info-item">
                    <label>Điện thoại:</label>
                    <span>{customerDetail.PhoneNumber || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <label>Địa chỉ:</label>
                    <span>{customerDetail.Address || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <label>Loại:</label>
                    <span className={`type-badge ${isAccountCustomer(customerDetail) ? "account" : "guest"}`}>
                      {getCustomerTypeLabel(customerDetail)}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Tổng chi tiêu:</label>
                    <span className="total-spent">{formatPrice(customerDetail.TotalSpent)}</span>
                  </div>
                </div>
              </div>

                <div className="info-section">
                  <h3>Thông tin tài khoản</h3>
                  {customerDetail.AccountEmail ? (
                    <div className="account-detail-card">
                      {customerDetail.Avatar && (
                        <img
                          src={resolveAvatarSrc(customerDetail.Avatar)}
                          alt="avatar"
                          className="account-detail-avatar"
                        />
                      )}
                      <div className="account-detail-info">
                        <div className="account-detail-name">
                          {customerDetail.DisplayName || customerDetail.AccountEmail}
                        </div>
                        <div className="account-detail-email">{customerDetail.AccountEmail}</div>
                        <div className="account-detail-role">
                          Vai trò: {customerDetail.Role === 0 ? "Khách hàng" : customerDetail.Role ?? "N/A"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-account">Khách hàng này chưa có tài khoản đăng nhập</div>
                  )}
                </div>

              <div className="orders-section">
                <h3>Lịch sử đơn hàng ({customerDetail.OrderCount || 0})</h3>
                {customerDetail.Orders && customerDetail.Orders.length > 0 ? (
                  <div className="orders-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Ngày đặt</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerDetail.Orders.map((order, idx) => (
                          <tr key={idx}>
                            <td>{order.OrderID || "N/A"}</td>
                            <td>
                              {order.OrderDate
                                ? new Date(order.OrderDate).toLocaleDateString("vi-VN")
                                : "N/A"}
                            </td>
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
                  <div className="no-orders">Chưa có đơn hàng</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPage;
