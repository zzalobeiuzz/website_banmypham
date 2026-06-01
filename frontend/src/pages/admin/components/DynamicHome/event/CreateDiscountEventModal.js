import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";

const initialForm = {
  code: "",
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  total_products_count: 0,
  status: 1,
  metadata: "",
  bannerFile: null,
};

const acceptTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];

const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const CreateDiscountEventModal = ({ open, onClose, onSaved, showPopup, event = null }) => {
  const { request } = useHttp();
  const inputRef = useRef(null);
  const previewUrlRef = useRef("");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    setForm(
      event
        ? {
            code: String(event.code || ""),
            title: String(event.title || ""),
            description: String(event.description || ""),
            start_date: formatDateForInput(event.start_date),
            end_date: formatDateForInput(event.end_date),
            total_products_count: Number(event.total_products_count || 0),
            status: Number(event.status) === 1 ? 1 : 0,
            metadata: String(event.metadata || ""),
            bannerFile: null,
          }
        : initialForm,
    );

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
    };
  }, [event, open]);

  const bannerPreview = useMemo(() => {
    if (form.bannerFile) {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = URL.createObjectURL(form.bannerFile);
      return previewUrlRef.current;
    }
    return "";
  }, [form.bannerFile]);

  const setFile = (file) => {
    if (!file) return;
    if (file.type && !acceptTypes.includes(file.type)) {
      showPopup?.({ status: "error", message: "Ảnh không hợp lệ. Chỉ nhận JPG, PNG, WEBP, GIF, AVIF." });
      return;
    }
    setForm((prev) => ({ ...prev, bannerFile: file }));
  };

  const onInputChange = (key) => (e) => {
    const value = e?.target?.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onPickFile = () => inputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) setFile(file);
  };

  const validate = () => {
    if (!String(form.title || "").trim()) return "Tiêu đề sự kiện không được để trống.";
    if (!form.bannerFile) return "Vui lòng kéo ảnh từ máy lên để tạo banner.";
    if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) {
      return "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.";
    }
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      showPopup?.({ status: "error", message: err });
      return;
    }

    const payload = new FormData();
    payload.append("code", String(form.code || "").trim());
    payload.append("title", String(form.title || "").trim());
    payload.append("description", String(form.description || "").trim());
    payload.append("start_date", form.start_date || "");
    payload.append("end_date", form.end_date || "");
    payload.append("status", String(Number(form.status) === 1 ? 1 : 0));
    payload.append("total_products_count", String(Number(form.total_products_count || 0)));
    payload.append("metadata", String(form.metadata || "").trim());
    payload.append("bannerFile", form.bannerFile);

    try {
      setSubmitting(true);
      const res = await request("POST", `${API_BASE}/api/admin/sale-events`, payload);
      if (!res?.success) {
        showPopup?.({ status: "error", message: res?.message || "Không thể tạo sự kiện giảm giá." });
        return;
      }

      showPopup?.({ status: "success", message: "Tạo sự kiện giảm giá thành công." });
      onSaved?.(res.data || null);
      onClose?.();
      setForm(initialForm);
    } catch (error) {
      showPopup?.({ status: "error", message: error?.message || "Không thể tạo sự kiện giảm giá." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal show sale-event-modal" tabIndex={-1} style={{ display: "block", background: "rgba(15,23,42,0.55)" }}>
      <div className="modal-dialog modal-xl sale-event-modal__dialog">
        <form className="modal-content sale-event-modal__content" onSubmit={submit}>
          <div className="modal-header sale-event-modal__header">
            <div>
              <div className="sale-event-modal__eyebrow">Sale Event Admin</div>
              <h5 className="modal-title">Tạo sự kiện giảm giá</h5>
            </div>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>

          <div className="modal-body sale-event-modal__body">
            <div className="row g-3">
              <div className="col-lg-8">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Mã sự kiện</label>
                    <input className="form-control" value={form.code} onChange={onInputChange("code")} placeholder="SUMMER-2026" />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Tiêu đề</label>
                    <input className="form-control" value={form.title} onChange={onInputChange("title")} placeholder="Summer Beauty Flash Sale" />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Mô tả</label>
                    <textarea className="form-control" rows={4} value={form.description} onChange={onInputChange("description")} placeholder="Mô tả ngắn về chương trình..." />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Ngày bắt đầu</label>
                    <input type="datetime-local" className="form-control" value={form.start_date} onChange={onInputChange("start_date")} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Ngày kết thúc</label>
                    <input type="datetime-local" className="form-control" value={form.end_date} onChange={onInputChange("end_date")} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Tổng sản phẩm</label>
                    <input type="number" min="0" className="form-control" value={form.total_products_count} onChange={onInputChange("total_products_count")} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Trạng thái</label>
                    <select className="form-select" value={form.status} onChange={onInputChange("status")}>
                      <option value={1}>Hoạt động</option>
                      <option value={0}>Tắt</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Metadata</label>
                    <input className="form-control" value={form.metadata} onChange={onInputChange("metadata")} placeholder='{"theme":"summer"}' />
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <label className="form-label">Ảnh banner</label>
                <div
                  className={`sale-event-upload ${isDragging ? "is-dragging" : ""}`}
                  onClick={onPickFile}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setFile(e.target.files?.[0])}
                  />

                  {bannerPreview ? (
                    <img className="sale-event-upload__preview" src={bannerPreview} alt="banner preview" />
                  ) : (
                    <div className="sale-event-upload__empty">
                      <div className="sale-event-upload__icon">⤴</div>
                      <div className="sale-event-upload__title">Kéo ảnh từ máy lên</div>
                      <div className="sale-event-upload__text">Hoặc bấm để chọn file JPG/PNG/WEBP/GIF</div>
                    </div>
                  )}
                </div>

                <div className="sale-event-upload__hint mt-2">
                  Ảnh banner sẽ được lưu vào máy chủ và dùng cho trang sự kiện.
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer sale-event-modal__footer">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Tạo sự kiện"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDiscountEventModal;