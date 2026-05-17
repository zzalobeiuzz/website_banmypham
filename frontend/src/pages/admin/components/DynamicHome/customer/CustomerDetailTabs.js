import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const CustomerDetailTabs = ({
  activeDetailTab,
  setActiveDetailTab,
  isEditingCustomer,
  openEditCustomerMode,
  cancelEditCustomerMode,
  editForm,
  handleChangeEditForm,
  isSavingCustomer,
  openUpdateConfirmPopup,
  editMessage,
  formatPrice,
  customerDetail,
  onViewOrderDetail,
}) => {
  // =========================
  // FILTER STATES
  // =========================
  const [orderKeyword, setOrderKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortDate, setSortDate] = useState("desc");
  const navigate = useNavigate();

  // =========================
  // UNIQUE STATUS LIST
  // =========================
  const orderStatuses = useMemo(() => {
    const statuses = (customerDetail?.Orders || []).map((x) => x.Status);

    return [...new Set(statuses.filter(Boolean))];
  }, [customerDetail]);

  // =========================
  // FILTER + SORT ORDERS
  // =========================
  const filteredOrders = useMemo(() => {
    const orders = [...(customerDetail?.Orders || [])];

    const filtered = orders.filter((order) => {
      // keyword
      const keyword = orderKeyword.trim().toLowerCase();

      const matchKeyword =
        !keyword ||
        String(order.OrderID || "")
          .toLowerCase()
          .includes(keyword);

      // status
      const matchStatus =
        statusFilter === "all" ||
        String(order.Status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchKeyword && matchStatus;
    });

    // sort date
    filtered.sort((a, b) => {
      const dateA = a.OrderDate ? new Date(a.OrderDate).getTime() : 0;

      const dateB = b.OrderDate ? new Date(b.OrderDate).getTime() : 0;

      return sortDate === "desc" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [customerDetail, orderKeyword, statusFilter, sortDate]);

  return (
    <>
      {/* ========================= */}
      {/* INFO TAB */}
      {/* ========================= */}
      {activeDetailTab === "info" && (
        <div className="info-section">
          <h3>{"Thông tin cơ bản"}</h3>

          <div className="info-actions">
            {!isEditingCustomer ? (
              <button
                className="btn-action edit"
                onClick={openEditCustomerMode}
              >
                {"Chỉnh sửa"}
              </button>
            ) : (
              <>
                <button
                  className="btn-action save"
                  onClick={openUpdateConfirmPopup}
                  disabled={isSavingCustomer}
                >
                  {isSavingCustomer ? "Đang lưu..." : "Lưu"}
                </button>

                <button
                  className="btn-action cancel"
                  onClick={cancelEditCustomerMode}
                  disabled={isSavingCustomer}
                >
                  {"Hủy"}
                </button>
              </>
            )}
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>{"Tên:"}</label>

              {isEditingCustomer ? (
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) =>
                    handleChangeEditForm("fullName", e.target.value)
                  }
                  disabled={isSavingCustomer}
                />
              ) : (
                <span className="editable-value">
                  {customerDetail.FullName || "N/A"}
                </span>
              )}
            </div>

            <div className="info-item">
              <label>{"Điện thoại:"}</label>

              {isEditingCustomer ? (
                <input
                  type="text"
                  value={editForm.phoneNumber}
                  onChange={(e) =>
                    handleChangeEditForm("phoneNumber", e.target.value)
                  }
                  disabled={isSavingCustomer}
                />
              ) : (
                <span className="editable-value">
                  {customerDetail.PhoneNumber || "N/A"}
                </span>
              )}
            </div>

            <div className="info-item">
              <label>{"Địa chỉ:"}</label>

              {isEditingCustomer ? (
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) =>
                    handleChangeEditForm("address", e.target.value)
                  }
                  disabled={isSavingCustomer}
                />
              ) : (
                <span className="editable-value">
                  {customerDetail.Address || "N/A"}
                </span>
              )}
            </div>

            <div className="info-item">
              <label>Email / ID:</label>

              <span className="editable-value">
                {customerDetail.CustomerID || "N/A"}
              </span>
            </div>

            <div className="info-item">
              <label>{"Số đơn hàng đã mua:"}</label>

              <span className="editable-value">
                {customerDetail.OrderCount ??
                  customerDetail.Orders?.length ??
                  0}
              </span>
            </div>

            <div className="info-item">
              <label>{"Tổng chi tiêu:"}</label>

              <span className="total-spent">
                {formatPrice(customerDetail.Total)}
              </span>
            </div>
          </div>

          {editMessage && <div className="edit-message">{editMessage}</div>}
        </div>
      )}

      {/* ========================= */}
      {/* ORDERS TAB */}
      {/* ========================= */}
      {activeDetailTab === "orders" && (
        <div className="orders-section">
          <h3>
            {"Lịch sử đơn hàng"} ({filteredOrders.length})
          </h3>

          {/* ========================= */}
          {/* FILTERS */}
          {/* ========================= */}
          <div className="orders-filters">
            <input
              type="text"
              placeholder="Tìm theo mã đơn hàng..."
              value={orderKeyword}
              onChange={(e) => setOrderKeyword(e.target.value)}
              className="filter-input"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả trạng thái</option>

              {orderStatuses.map((status, idx) => (
                <option key={idx} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={sortDate}
              onChange={(e) => setSortDate(e.target.value)}
              className="filter-select"
            >
              <option value="desc">Mới nhất → Cũ nhất</option>

              <option value="asc">Cũ nhất → Mới nhất</option>
            </select>
          </div>

          {/* ========================= */}
          {/* TABLE */}
          {/* ========================= */}
          {filteredOrders.length > 0 ? (
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>{"Mã đơn"}</th>
                    <th>{"Ngày đặt"}</th>
                    <th>{"Tổng tiền"}</th>
                    <th>{"Trạng thái"}</th>
                    <th>{"Hành động"}</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order, idx) => (
                    <tr key={idx}>
                      <td>{order.OrderID || "N/A"}</td>

                      <td>
                        {order.OrderDate
                          ? new Date(order.OrderDate).toLocaleDateString(
                              "vi-VN",
                            )
                          : "N/A"}
                      </td>

                      <td className="price-cell">
                        {formatPrice(order.Total || order.TotalPrice)}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${String(order.Status || "")
                            .toLowerCase()
                            .replace(/đ/g, "d")
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/\s+/g, "-")
                            .replace(/[^\w-]/g, "")}`}
                        >
                          {order.Status || "Chờ xác nhận"}
                        </span>
                      </td>

                      <td>
                        <button
                          className="btn-action detail"
                          onClick={() => {
                            const id = order.OrderID || order.OrderId || order.id || "";
                            if (id) {
                              navigate(`/admin/order/${encodeURIComponent(id)}`);
                            } else {
                              // Fallback to callback if no id available
                              onViewOrderDetail?.(order);
                            }
                          }}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-orders">{"Không tìm thấy đơn hàng"}</div>
          )}
        </div>
      )}

      {/* ========================= */}
      {/* SIDE TABS */}
      {/* ========================= */}
      <div
        className={`popup-side-tabs outside ${
          activeDetailTab === "info" ? "tab-info" : "tab-orders"
        }`}
      >
        <button
          type="button"
          className={`side-tab-btn ${
            activeDetailTab === "info" ? "active" : ""
          }`}
          onClick={() => setActiveDetailTab("info")}
        >
          {"Thông tin"}
        </button>

        <button
          type="button"
          className={`side-tab-btn ${
            activeDetailTab === "orders" ? "active" : ""
          }`}
          onClick={() => setActiveDetailTab("orders")}
        >
          {"Lịch sử mua hàng"}
        </button>
      </div>
    </>
  );
};

export default CustomerDetailTabs;
