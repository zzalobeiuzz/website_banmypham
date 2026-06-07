import React, { useCallback, useEffect, useMemo, useState } from "react";
import useHttp from "../../../../../hooks/useHttp";
import { API_BASE } from "../../../../../constants";
import Notification from "../../shared/Notification";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import CreateDiscountEventModal from "./CreateDiscountEventModal";
import "./DiscountEventsPage.scss";

const parseMetadata = (value) => {
  try {
    return typeof value === "string" ? JSON.parse(value || "{}") : value || {};
  } catch {
    return {};
  }
};

const getBannerPositionLabel = (value) => {
  const metadata = parseMetadata(value);
  if (metadata?.showOnHome !== true) return "Không hiện trang chủ";
  if (metadata?.homeBannerSection === "main") return "Main";
  if (metadata?.homeBannerSection === "side" && metadata?.homeBannerPosition === "top") return "Side trên";
  if (metadata?.homeBannerSection === "side" && metadata?.homeBannerPosition === "bottom") return "Side dưới";
  return "Trang chủ";
};

const getEventStatus = (event) => {
  if (Number(event?.status) !== 1) {
    return { label: "Tắt", className: "is-off" };
  }

  const now = new Date();
  const start = event?.start_date ? new Date(event.start_date) : null;
  const end = event?.end_date ? new Date(event.end_date) : null;

  if (start && !Number.isNaN(start.getTime()) && now < start) {
    return { label: "Sắp diễn ra", className: "is-upcoming" };
  }

  if (end && !Number.isNaN(end.getTime()) && now > end) {
    return { label: "Đã kết thúc", className: "is-ended" };
  }

  return { label: "Đang chạy", className: "is-active" };
};

const DiscountEventsPage = () => {
  const { request } = useHttp();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loadingEditId, setLoadingEditId] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
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

  const eventStats = useMemo(() => {
    const active = events.filter((event) => getEventStatus(event).className === "is-active").length;
    const upcoming = events.filter((event) => getEventStatus(event).className === "is-upcoming").length;
    const shownOnHome = events.filter((event) => parseMetadata(event?.metadata)?.showOnHome === true).length;
    const products = events.reduce((sum, event) => sum + Number(event?.total_products_count || 0), 0);

    return [
      { label: "Tổng sự kiện", value: events.length },
      { label: "Đang chạy", value: active },
      { label: "Sắp diễn ra", value: upcoming },
      { label: "Hiện trang chủ", value: shownOnHome },
      { label: "Sản phẩm sale", value: products },
    ];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const keyword = String(searchKeyword || "").trim().toLowerCase();
    if (!keyword) return events;

    return events.filter((event) => {
      const title = String(event?.title || "").toLowerCase();
      const code = String(event?.code || "").toLowerCase();
      const position = getBannerPositionLabel(event?.metadata).toLowerCase();
      const status = getEventStatus(event).label.toLowerCase();

      return title.includes(keyword) || code.includes(keyword) || position.includes(keyword) || status.includes(keyword);
    });
  }, [events, searchKeyword]);

  const closeModal = () => {
    setOpenCreate(false);
    setEditingEvent(null);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setOpenCreate(true);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
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

  const handleDeleteEvent = async (event) => {
    const eventId = event?.id;
    if (!eventId || deletingEventId) return;

    const eventTitle = String(event?.title || `EVENT-${eventId}`).trim();
    const confirmed = window.confirm(
      `Xóa sự kiện "${eventTitle}"?\nCác sản phẩm sale thuộc sự kiện này cũng sẽ bị xóa.`
    );
    if (!confirmed) return;

    try {
      setDeletingEventId(eventId);
      const res = await request("DELETE", `${API_BASE}/api/admin/sale-events/${encodeURIComponent(String(eventId))}`);
      if (!res?.success) {
        showPopup({ status: "error", message: res?.message || "Không thể xóa sự kiện giảm giá." });
        return;
      }

      showPopup({ status: "success", message: res?.message || "Xóa sự kiện giảm giá thành công." });
      await fetchEvents();
    } catch (error) {
      showPopup({ status: "error", message: error?.message || "Không thể xóa sự kiện giảm giá." });
    } finally {
      setDeletingEventId(null);
    }
  };

  return (
    <div className="admin-discount-events">
      <Notification open={notify.open} status={notify.status} message={notify.message} onClose={closePopup} />
      <CreateDiscountEventModal
        open={openCreate}
        onClose={closeModal}
        onSaved={fetchEvents}
        showPopup={showPopup}
        event={editingEvent}
      />

      <div className="discount-events-hero">
        <h3>Sự kiện giảm giá</h3>
        <div className="discount-events-hero__actions">
          <form className="discount-events-search d-flex" role="search" onSubmit={handleSearchSubmit}>
            <input
              className="form-control me-2"
              type="search"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tìm kiếm..."
            />
            <button className="btn btn-outline-success" type="submit">Tìm</button>
          </form>
        </div>
      </div>

      <div className="discount-events-stats">
        {eventStats.map((item) => (
          <div className="discount-events-stat" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      {loading ? (
        <AdminLoadingScreen message="Đang tải danh sách sự kiện giảm giá..." />
      ) : events.length === 0 ? (
        <div className="discount-events-empty">
          <div className="discount-events-empty__icon">%</div>
          <h4>Chưa có sự kiện giảm giá</h4>
          <p>Tạo sự kiện đầu tiên để thiết lập banner trang chủ và giá sale cho sản phẩm.</p>
          <button type="button" onClick={openCreateModal}>Tạo sự kiện ngay</button>
        </div>
      ) : (
        <div className="discount-events-table-card">
          <div className="discount-events-table-card__header">
            <div>
              <h4>Danh sách sự kiện</h4>
              <span>{filteredEvents.length} / {events.length} chương trình</span>
            </div>
            <button type="button" className="discount-events-hero__button admin-create-btn" onClick={openCreateModal}>
              <span className="admin-create-btn__icon" />
              Tạo sự kiện
            </button>
          </div>
          <div className="discount-events-table-wrap">
            <table className="table discount-events-table">
              <thead>
                <tr>
                  <th>Sự kiện</th>
                  <th>Thời gian</th>
                  <th>Banner</th>
                  <th>Vị trí</th>
                  <th>Sản phẩm</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="discount-events-no-result">Không tìm thấy sự kiện phù hợp.</div>
                    </td>
                  </tr>
                ) : filteredEvents.map((event, idx) => {
                  const status = getEventStatus(event);

                  return (
                    <tr key={event.id || idx}>
                      <td>
                        <div className="discount-event-title-cell">
                          <strong title={event.title}>{event.title}</strong>
                          <span>{event.code || `EVENT-${event.id || idx + 1}`}</span>
                        </div>
                      </td>
                      <td>
                        <div className="discount-event-date-cell">
                          <span>{formatDate(event.start_date)}</span>
                          <small>{formatDate(event.end_date)}</small>
                        </div>
                      </td>
                      <td>
                        {event.banner_image ? (
                          <img className="discount-event-thumb" src={resolveImageUrl(event.banner_image)} alt={event.title} />
                        ) : (
                          <div className="discount-event-thumb is-empty">No image</div>
                        )}
                      </td>
                      <td>
                        <span className="discount-event-position">{getBannerPositionLabel(event.metadata)}</span>
                      </td>
                      <td>
                        <span className="discount-event-products-count">{Number(event.total_products_count || 0)}</span>
                      </td>
                      <td>
                        <span className={`discount-event-status ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="text-end">
                        <div className="discount-event-actions">
                          <button
                            type="button"
                            className="discount-event-edit-btn"
                            onClick={() => openEditModal(event)}
                            disabled={loadingEditId === event.id || deletingEventId === event.id}
                          >
                            {loadingEditId === event.id ? "Đang tải..." : "Sửa"}
                          </button>
                          <button
                            type="button"
                            className="discount-event-delete-btn"
                            onClick={() => handleDeleteEvent(event)}
                            disabled={deletingEventId === event.id || loadingEditId === event.id}
                          >
                            {deletingEventId === event.id ? "Đang xóa..." : "Xóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountEventsPage;
