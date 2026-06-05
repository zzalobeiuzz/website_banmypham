import React, { useEffect, useState, useCallback } from "react";
import useHttp from "../../../../../hooks/useHttp";
import { API_BASE } from "../../../../../constants";
import Notification from "../../shared/Notification";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import CreateDiscountEventModal from "./CreateDiscountEventModal";
import "./DiscountEventsPage.scss";

const DiscountEventsPage = () => {
  const { request } = useHttp();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loadingEditId, setLoadingEditId] = useState(null);
  const [notify, setNotify] = useState({ open: false, status: "info", message: "" });

  const showPopup = useCallback(({ status, message }) => {
    setNotify({ open: true, status: status || "info", message: String(message || "") });
  }, []);

  const closePopup = () => setNotify((prev) => ({ ...prev, open: false }));

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request("GET", `${API_BASE}/api/admin/sale-events`);
      setEvents(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setEvents([]);
      showPopup({ status: "error", message: err?.message || "Không thể tải danh sách sự kiện giảm giá." });
    } finally {
      setLoading(false);
    }
  }, [request, showPopup]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const resolveImageUrl = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
    if (raw.includes("/")) return `${API_BASE}/${raw.replace(/^\/+/, "")}`;
    return `${API_BASE}/uploads/assets/pictures/BannerImage/${raw}`;
  };

  const formatDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "--" : date.toLocaleDateString("vi-VN");
  };

  const closeModal = () => {
    setOpenCreate(false);
    setEditingEvent(null);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setOpenCreate(true);
  };

  const openEditModal = async (event) => {
    const eventId = event?.id;
    if (!eventId) return;

    try {
      setLoadingEditId(eventId);
      const res = await request("GET", `${API_BASE}/api/admin/sale-events/${encodeURIComponent(String(eventId))}`);
      if (!res?.success || !res?.data) {
        showPopup({ status: "error", message: res?.message || "Không thể tải chi tiết sự kiện." });
        return;
      }
      setEditingEvent(res.data);
      setOpenCreate(true);
    } catch (error) {
      showPopup({ status: "error", message: error?.message || "Không thể tải chi tiết sự kiện." });
    } finally {
      setLoadingEditId(null);
    }
  };

  return (
    <div className="admin-discount-events p-3">
      <Notification open={notify.open} status={notify.status} message={notify.message} onClose={closePopup} />
      <CreateDiscountEventModal
        open={openCreate}
        onClose={closeModal}
        onSaved={fetchEvents}
        showPopup={showPopup}
        event={editingEvent}
      />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Sự kiện giảm giá</h3>
        <button className="btn btn-primary" onClick={openCreateModal}>Tạo sự kiện mới</button>
      </div>

      {loading ? (
        <AdminLoadingScreen message="Đang tải danh sách sự kiện giảm giá..." />
      ) : events.length === 0 ? (
        <div>Chưa có sự kiện giảm giá.</div>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Mã</th>
              <th>Tiêu đề</th>
              <th>Thời gian</th>
              <th>Ảnh</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, idx) => (
              <tr key={event.id || idx}>
                <td>{idx + 1}</td>
                <td>{event.code || "-"}</td>
                <td>{event.title}</td>
                <td>
                  {formatDate(event.start_date)} - {formatDate(event.end_date)}
                </td>
                <td>
                  {event.banner_image ? <img src={resolveImageUrl(event.banner_image)} alt={event.title} style={{ width: 120 }} /> : "-"}
                </td>
                <td>{Number(event.status) === 1 ? "Hoạt động" : "Tắt"}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => openEditModal(event)}
                    disabled={loadingEditId === event.id}
                  >
                    {loadingEditId === event.id ? "Đang tải..." : "Sửa"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DiscountEventsPage;
