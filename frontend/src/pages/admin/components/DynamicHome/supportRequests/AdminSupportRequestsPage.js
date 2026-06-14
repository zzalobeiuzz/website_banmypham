import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../../../constants";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import useMinimumLoading from "../../useMinimumLoading";
import "./AdminSupportRequestsPage.scss";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getIssueLabel = (value) => {
  const labels = {
    order: "Đơn hàng",
    payment: "Thanh toán",
    shipping: "Giao hàng",
    product: "Sản phẩm",
    return: "Đổi trả",
    other: "Khác",
  };

  return labels[value] || value || "Chưa phân loại";
};

const AdminSupportRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const showLoading = useMinimumLoading(loading, 450);

  const fetchSupportRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE}/api/support-requests/admin?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Không thể tải yêu cầu hỗ trợ.");
      }

      const items = Array.isArray(payload.data) ? payload.data : [];
      setRequests(items);
      setSelectedRequest((prev) => {
        if (prev) {
          return items.find((item) => String(item.id) === String(prev.id)) || items[0] || null;
        }
        return items[0] || null;
      });
    } catch (error) {
      setRequests([]);
      setSelectedRequest(null);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupportRequests();
  }, [fetchSupportRequests]);

  const unreadCount = useMemo(() => requests.filter((item) => !item.isRead).length, [requests]);
  const readCount = requests.length - unreadCount;

  const filteredRequests = useMemo(() => {
    const keyword = String(searchKeyword || "").trim().toLowerCase();

    return requests.filter((item) => {
      if (filter === "unread" && item.isRead) return false;
      if (filter === "read" && !item.isRead) return false;
      if (!keyword) return true;

      return [
        item.fullName,
        item.phone,
        item.orderCode,
        item.issueType,
        item.message,
      ].some((value) => String(value || "").toLowerCase().includes(keyword));
    });
  }, [filter, requests, searchKeyword]);

  const markAsRead = async (requestItem) => {
    if (!requestItem || requestItem.isRead) {
      setSelectedRequest(requestItem);
      return;
    }

    setSelectedRequest(requestItem);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE}/api/support-requests/admin/${requestItem.id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.success === false) return;

      const nextItem = { ...requestItem, isRead: true, readAt: payload.data?.readAt || new Date().toISOString() };
      setRequests((prev) => prev.map((item) => (String(item.id) === String(requestItem.id) ? nextItem : item)));
      setSelectedRequest(nextItem);
    } catch (error) {
      console.error(error);
    }
  };

  if (showLoading) {
    return <AdminLoadingScreen text="Đang tải yêu cầu hỗ trợ..." />;
  }

  return (
    <main className="admin-support-requests">
      <section className="admin-support-requests__hero">
        <div>
          <span>Chăm sóc khách hàng</span>
          <h1>Yêu cầu hỗ trợ</h1>
          <p>Theo dõi các vấn đề khách hàng gửi từ trang hỗ trợ và xử lý nhanh từng nội dung.</p>
        </div>
        <button type="button" onClick={fetchSupportRequests}>Làm mới</button>
      </section>

      <section className="admin-support-requests__stats">
        <article>
          <span>Tổng yêu cầu</span>
          <strong>{requests.length}</strong>
        </article>
        <article className="is-unread">
          <span>Chưa đọc</span>
          <strong>{unreadCount}</strong>
        </article>
        <article className="is-read">
          <span>Đã đọc</span>
          <strong>{readCount}</strong>
        </article>
      </section>

      <section className="admin-support-requests__toolbar">
        <div className="admin-support-requests__search">
          <input
            type="text"
            placeholder="Tìm theo tên, số điện thoại, mã đơn hoặc nội dung..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </div>
        <div className="admin-support-requests__filters">
          {[
            { key: "all", label: "Tất cả" },
            { key: "unread", label: "Chưa đọc" },
            { key: "read", label: "Đã đọc" },
          ].map((item) => (
            <button
              type="button"
              key={item.key}
              className={filter === item.key ? "is-active" : ""}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="admin-support-requests__workspace">
        <div className="admin-support-requests__list">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`admin-support-request-card${selectedRequest?.id === item.id ? " is-selected" : ""}${item.isRead ? "" : " is-unread"}`}
                onClick={() => markAsRead(item)}
              >
                <span className="admin-support-request-card__status">{item.isRead ? "Đã đọc" : "Mới"}</span>
                <strong>{item.fullName || "Khách hàng chưa nhập tên"}</strong>
                <small>{formatDateTime(item.createdAt)}</small>
                <p>{item.message || "Không có nội dung"}</p>
              </button>
            ))
          ) : (
            <div className="admin-support-requests__empty">Không có yêu cầu phù hợp.</div>
          )}
        </div>

        <div className="admin-support-requests__detail">
          {selectedRequest ? (
            <>
              <div className="admin-support-requests__detail-head">
                <span>{selectedRequest.isRead ? "Đã đọc" : "Chưa đọc"}</span>
                <h2>{selectedRequest.fullName || "Khách hàng chưa nhập tên"}</h2>
                <p>Gửi lúc {formatDateTime(selectedRequest.createdAt)}</p>
              </div>

              <div className="admin-support-requests__info-grid">
                <div>
                  <span>Số điện thoại</span>
                  <strong>{selectedRequest.phone || "Chưa cung cấp"}</strong>
                </div>
                <div>
                  <span>Loại vấn đề</span>
                  <strong>{getIssueLabel(selectedRequest.issueType)}</strong>
                </div>
                <div>
                  <span>Mã đơn hàng</span>
                  <strong>{selectedRequest.orderCode || "Không có"}</strong>
                </div>
                <div>
                  <span>Đọc lúc</span>
                  <strong>{formatDateTime(selectedRequest.readAt)}</strong>
                </div>
              </div>

              <article className="admin-support-requests__message">
                <span>Nội dung yêu cầu</span>
                <p>{selectedRequest.message || "Không có nội dung"}</p>
              </article>
            </>
          ) : (
            <div className="admin-support-requests__empty admin-support-requests__empty--detail">
              Chưa có yêu cầu hỗ trợ nào.
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default AdminSupportRequestsPage;
