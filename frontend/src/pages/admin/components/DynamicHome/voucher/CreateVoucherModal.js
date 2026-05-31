import React, { useState, useEffect } from "react";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";

const initialForm = {
  VoucherCode: "",
  Title: "",
  Detail: "",
  DiscountAmount: "",
  MinOrderAmount: "",
  TotalQuota: 1,
  IsActive: 1,
  IsPublic: 'private',
  StartDate: "",
  EndDate: "",
};

export default function CreateVoucherModal({
  open,
  onClose,
  onSaved,
  showPopup,
  voucher = null,
  mode = "create",
}) {
  const { request } = useHttp();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const nextForm = voucher
      ? {
          VoucherCode: String(voucher.VoucherCode || voucher.Code || ""),
          Title: String(voucher.Title || ""),
          Detail: String(voucher.Detail || ""),
          DiscountAmount: formatMoneyInput(voucher.DiscountAmount),
          MinOrderAmount: formatMoneyInput(voucher.MinOrderAmount),
          TotalQuota: Number(voucher.TotalQuota || 1),
          IsActive: Number(voucher.IsActive) ? 1 : 0,
          IsPublic: voucher.IsPublic ? String(voucher.IsPublic) : 'private',
          StartDate: voucher.StartDate ? String(voucher.StartDate).slice(0, 10) : "",
          EndDate: voucher.EndDate ? String(voucher.EndDate).slice(0, 10) : "",
        }
      : initialForm;

    setForm(nextForm);
  }, [open, voucher]);

  if (!open) return null;

  const formatCurrency = (value) => {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return "0đ";
    return `${new Intl.NumberFormat("vi-VN").format(number)}đ`;
  };

  const formatMoneyInput = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    return new Intl.NumberFormat("vi-VN").format(Number(digits));
  };

  const parseMoneyInput = (value) => Number(String(value || "").replace(/\D/g, "")) || 0;

  const change = (key) => (e) => {
    const v = e?.target?.value;
    if (key === "DiscountAmount" || key === "MinOrderAmount") {
      setForm((p) => ({ ...p, [key]: formatMoneyInput(v) }));
      return;
    }
    setForm((p) => ({ ...p, [key]: v }));
  };

  const toggleActive = () => setForm((p) => ({ ...p, IsActive: p.IsActive ? 0 : 1 }));
  const togglePublic = () => setForm((p) => ({ ...p, IsPublic: p.IsPublic === 'public' ? 'private' : 'public' }));

  const validate = () => {
    if (!String(form.VoucherCode || "").trim()) return "Mã voucher không được để trống";
    if (!parseMoneyInput(form.DiscountAmount) || parseMoneyInput(form.DiscountAmount) <= 0) return "Giảm giá phải lớn hơn 0";
    if (!form.TotalQuota || Number(form.TotalQuota) <= 0) return "Số lượng voucher phải lớn hơn 0";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return showPopup({ status: "error", message: err });

    try {
      setSubmitting(true);
      const payload = {
        VoucherCode: String(form.VoucherCode || "").trim(),
        Title: String(form.Title || "").trim(),
        Detail: String(form.Detail || "").trim(),
        DiscountAmount: parseMoneyInput(form.DiscountAmount),
        MinOrderAmount: parseMoneyInput(form.MinOrderAmount),
        TotalQuota: Number(form.TotalQuota) || 0,
        IsActive: Number(form.IsActive) ? 1 : 0,
        IsPublic: String(form.IsPublic || 'private'),
        StartDate: form.StartDate || null,
        EndDate: form.EndDate || null,
      };

      const isEdit = mode === "edit";
      const identifier = String(voucher?.VoucherID ?? voucher?.VoucherId ?? voucher?.ID ?? voucher?.VoucherCode ?? "").trim();
      const url = isEdit && identifier
        ? `${API_BASE}/api/admin/voucher/${encodeURIComponent(identifier)}`
        : `${API_BASE}/api/admin/voucher`;
      const method = isEdit ? "PUT" : "POST";

      const res = await request(method, url, payload);
      if (!res?.success) {
        showPopup({ status: "error", message: res?.message || (isEdit ? "Không thể cập nhật voucher." : "Không thể tạo voucher.") });
        return;
      }

      showPopup({ status: "success", message: isEdit ? "Cập nhật voucher thành công." : "Tạo voucher thành công." });
      setForm(initialForm);
      if (typeof onSaved === "function") onSaved(res.data || null);
      if (typeof onClose === "function") onClose();
    } catch (err) {
      showPopup({ status: "error", message: err?.message || (mode === "edit" ? "Lỗi khi cập nhật voucher." : "Lỗi khi tạo voucher.") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show voucher-create-modal" tabIndex={-1} style={{ display: "block", background: "rgba(15,23,42,0.55)" }}>
      <div className="modal-dialog modal-lg voucher-create-modal__dialog">
        <form className="modal-content voucher-create-modal__content" onSubmit={submit}>
          <div className="modal-header voucher-create-modal__header">
            <div>
              <div className="voucher-create-modal__eyebrow">Voucher Admin</div>
              <h5 className="modal-title">{mode === "edit" ? "Sửa Voucher" : "Tạo Voucher mới"}</h5>
            </div>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>

          <div className="modal-body voucher-create-modal__body">
            <div className="row">
              <div className="col-md-8">
                <div className="mb-3">
                  <label className="form-label">Mã Voucher</label>
                  <input className="form-control form-control-lg" value={form.VoucherCode} onChange={change("VoucherCode")} placeholder="VD: COCOLUX75K" />
                </div>

                <div className="mb-3">
                  <label className="form-label">Tiêu đề</label>
                  <input className="form-control" value={form.Title} onChange={change("Title")} />
                </div>

                <div className="mb-3">
                  <label className="form-label">Áp dụng cho đơn hàng</label>
                  <textarea className="form-control" value={form.Detail} onChange={change("Detail")} rows={3} placeholder="VD: Đơn hàng đầu tiên, đơn từ 500k..." />
                </div>

                <div className="row g-2">
                  <div className="col-lg-4 col-md-6">
                    <label className="form-label">Giảm giá (số)</label>
                    <div className="input-group">
                      <input type="text" inputMode="numeric" className="form-control" value={form.DiscountAmount} onChange={change("DiscountAmount")} placeholder="10.000" />
                      <span className="input-group-text">đ</span>
                    </div>
                    <div className="form-text">Ví dụ: 10.000đ</div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <label className="form-label">Đơn tối thiểu</label>
                    <div className="input-group">
                      <input type="text" inputMode="numeric" className="form-control" value={form.MinOrderAmount} onChange={change("MinOrderAmount")} placeholder="10.000" />
                      <span className="input-group-text">đ</span>
                    </div>
                    <div className="form-text">Ví dụ: 10.000đ</div>
                  </div>
                  <div className="col-lg-4 col-md-12">
                    <label className="form-label">Số lượng voucher</label>
                    <input type="number" min="1" className="form-control" value={form.TotalQuota} onChange={change("TotalQuota")} />
                  </div>
                </div>

                <div className="row g-2 mt-2">
                  <div className="col-6">
                    <label className="form-label">Bắt đầu</label>
                    <input type="date" className="form-control" value={form.StartDate} onChange={change("StartDate")} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Kết thúc</label>
                    <input type="date" className="form-control" value={form.EndDate} onChange={change("EndDate")} />
                  </div>
                </div>

                <div className="form-check form-switch mt-3">
                  <input className="form-check-input" type="checkbox" id="voucherIsActive" checked={!!form.IsActive} onChange={toggleActive} />
                  <label className="form-check-label" htmlFor="voucherIsActive">Đang hoạt động</label>
                </div>
                <div className="form-check form-switch mt-2">
                  <input className="form-check-input" type="checkbox" id="voucherIsPublic" checked={form.IsPublic === 'public'} onChange={togglePublic} />
                  <label className="form-check-label" htmlFor="voucherIsPublic">Công khai (chia sẻ trên web)</label>
                </div>
              </div>

              <div className="col-md-4">
                <div className="voucher-modal-preview">
                  <div className="voucher-card-preview voucher-create-modal__preview-card">
                    <div className="text-muted small voucher-create-modal__preview-label">Xem trước</div>
                    <div className="h5 mt-2 voucher-create-modal__preview-title">{form.Title || 'Tiêu đề voucher'}</div>
                    <div className="mb-2 voucher-create-modal__preview-code">{form.VoucherCode || 'MÃ_VOUCHER'}</div>
                    <div className="fw-bold voucher-create-modal__preview-discount">-{formatCurrency(parseMoneyInput(form.DiscountAmount))}</div>
                    <div className="voucher-create-modal__preview-quota">SL: {Number(form.TotalQuota || 0)}</div>
                    <div className="text-muted small mt-2 voucher-create-modal__preview-detail">{form.Detail}</div>
                    <div className="mt-2">
                      <span className={`badge ${form.IsPublic === 'public' ? 'bg-success' : 'bg-secondary'}`}>{form.IsPublic === 'public' ? 'Công khai' : 'Riêng tư'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer voucher-create-modal__footer">
            <button type="button" className="btn btn-secondary voucher-create-modal__cancel" onClick={onClose} disabled={submitting}>Hủy</button>
            <button type="submit" className="btn btn-primary voucher-create-modal__submit" disabled={submitting}>
              {submitting ? (
                <><span className="spinner-border spinner-border-sm me-2" />{mode === "edit" ? "Đang lưu..." : "Đang tạo..."}</>
              ) : (mode === "edit" ? "Lưu thay đổi" : 'Tạo Voucher')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
