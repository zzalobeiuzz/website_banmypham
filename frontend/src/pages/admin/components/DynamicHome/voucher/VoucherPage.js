import React, { useEffect, useMemo, useState, useCallback } from "react";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import ToolBar from "../../ToolBar";
import CreateVoucherModal from "./CreateVoucherModal";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import Notification from "../../shared/Notification";
import useMinimumLoading from "../../useMinimumLoading";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./voucher.scss";

const formatCurrency = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0đ";
  return `${new Intl.NumberFormat("vi-VN").format(number)}đ`;
};

const formatDateOnly = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(date);
};

const VoucherPage = () => {
  const { request } = useHttp();
  const [vouchers, setVouchers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [deletingVoucherId, setDeletingVoucherId] = useState("");
  const [loading, setLoading] = useState(true);
  const showLoading = useMinimumLoading(loading, 500);
  const [notify, setNotify] = useState({
    open: false,
    status: "info",
    message: "",
  });

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

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await request("GET", `${API_BASE}/api/admin/voucher`);

      if (!res?.success) {
        showPopup({
          status: "error",
          message: res?.message || "Không thể tải danh sách voucher.",
        });
        setVouchers([]);
        return;
      }

      setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      showPopup({
        status: "error",
        message: error?.message || "Không thể tải danh sách voucher.",
      });
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const filteredVouchers = useMemo(() => {
    const keyword = String(searchKeyword || "")
      .trim()
      .toLowerCase();
    if (!keyword) return vouchers;

    return vouchers.filter((voucher) => {
      const fields = [
        voucher?.VoucherCode,
        voucher?.Title,
        voucher?.Detail,
        voucher?.DiscountAmount,
        voucher?.MinOrderAmount,
        voucher?.Progress,
      ];

      return fields.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(keyword),
      );
    });
  }, [searchKeyword, vouchers]);

  const copyVoucherCode = async (code) => {
    const normalizedCode = String(code || "").trim();
    if (!normalizedCode) return;

    try {
      await navigator.clipboard.writeText(normalizedCode);
      showPopup({
        status: "success",
        message: `Đã sao chép mã ${normalizedCode}.`,
      });
    } catch (error) {
      showPopup({ status: "error", message: "Không thể sao chép mã voucher." });
    }
  };

  const renderStatus = (value) => {
    const active =
      Number(value) === 1 || String(value).toLowerCase() === "true";
    return active ? "Đang hoạt động" : "Tạm dừng";
  };

  const openCreateModal = () => {
    setEditingVoucher(null);
    setShowCreate(true);
  };

  const openEditModal = (voucher) => {
    setEditingVoucher(voucher || null);
    setShowCreate(true);
  };

  const handleSavedVoucher = async () => {
    setEditingVoucher(null);
    await fetchVouchers();
  };

  const handleDeleteVoucher = async (voucher) => {
    const identifier = String(voucher?.VoucherID ?? voucher?.VoucherId ?? voucher?.ID ?? voucher?.VoucherCode ?? "").trim();
    const code = String(voucher?.VoucherCode || identifier || "").trim();
    if (!identifier) {
      showPopup({ status: "error", message: "Không tìm thấy voucher để xóa." });
      return;
    }

    const ok = window.confirm(`Xóa voucher ${code || identifier}?`);
    if (!ok) return;

    try {
      setDeletingVoucherId(identifier);
      const res = await request("DELETE", `${API_BASE}/api/admin/voucher/${encodeURIComponent(identifier)}`);
      if (!res?.success) {
        showPopup({ status: "error", message: res?.message || "Không thể xóa voucher." });
        return;
      }

      showPopup({ status: "success", message: `Đã xóa voucher ${code || identifier}.` });
      await fetchVouchers();
    } catch (error) {
      showPopup({ status: "error", message: error?.message || "Không thể xóa voucher." });
    } finally {
      setDeletingVoucherId("");
    }
  };

  return (
    <div className="voucher-admin-page">
      <Notification
        open={notify.open}
        status={notify.status}
        message={notify.message}
        onClose={closePopup}
      />

      <div className="voucher-admin-header">
        <ToolBar
          title="Quản lý voucher"
          onSearchChange={setSearchKeyword}
        />
      </div>

      <CreateVoucherModal
        open={showCreate}
        mode={editingVoucher ? "edit" : "create"}
        voucher={editingVoucher}
        onClose={() => {
          setShowCreate(false);
          setEditingVoucher(null);
        }}
        onSaved={handleSavedVoucher}
        showPopup={showPopup}
      />

      {showLoading ? (
        <AdminLoadingScreen message="Đang tải danh sách voucher..." />
      ) : (
        <div className="voucher-admin-list">
          <div className="mb-3 text-muted">
            <div className="voucher-stats mb-3">
              <div className="voucher-stat">
                <div className="text-muted small">Tổng voucher</div>
                <div className="h5 mt-1">{filteredVouchers.length}</div>
              </div>
              <div className="voucher-stat">
                <div className="text-muted small">Đang hoạt động</div>
                <div className="h5 mt-1">
                  {
                    filteredVouchers.filter(
                      (v) => v.IsActive === 1 || String(v.IsActive) === "true",
                    ).length
                  }
                </div>
              </div>
              <div className="voucher-stat">
                <div className="text-muted small">Đã sử dụng (tổng)</div>
                <div className="h5 mt-1">
                  {filteredVouchers.reduce(
                    (s, v) => s + Number(v.ClaimedCount || 0),
                    0,
                  )}
                </div>
              </div>
              <div className="voucher-stats-actions">
                <button
                  type="button"
                  className="voucher-add-btn admin-create-btn"
                  onClick={openCreateModal}
                  title="Tạo Voucher"
                >
                  <span className="admin-create-btn__icon" />
                  Tạo voucher
                </button>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th className="col-code">Mã</th>
                  <th className="col-detail">Chi tiết</th>
                  <th className="col-discount">Giảm giá</th>
                  <th className="col-minorder">Đơn tối thiểu</th>
                  <th className="col-progress">Tiến độ</th>
                  <th className="col-status">Trạng thái</th>
                  <th className="col-date">Hạn dùng</th>
                  <th className="col-actions" style={{ width: 150 }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.length > 0 ? (
                  filteredVouchers.map((voucher, index) => {
                    const code = String(voucher?.VoucherCode || "").trim();
                    const claimed = Number(voucher?.ClaimedCount || 0);
                    const total =
                      voucher?.TotalQuota == null
                        ? null
                        : Number(voucher?.TotalQuota);
                    const progress = Number(
                      voucher?.ProgressPct ?? voucher?.Progress ?? 0,
                    );
                    const safeProgress = Number.isFinite(progress)
                      ? Math.max(0, Math.min(progress, 100))
                      : 0;

                    return (
                      <tr key={`${code || "voucher"}-${index}`}>
                        <td className="td-code">
                          <span
                            className="badge-voucher badge-voucher-sm"
                            title={code}
                          >
                            {code || "-"}
                          </span>
                        </td>

                        <td className="td-detail">
                          <div>
                            <div className="fw-semibold voucher-title">
                              {voucher?.Title || "-"}
                            </div>
                            <div className="text-muted small voucher-description">
                              {voucher?.Detail || "-"}
                            </div>
                          </div>
                        </td>

                        <td className="td-discount">
                          {formatCurrency(voucher?.DiscountAmount)}
                        </td>

                        <td className="td-minorder">
                          {formatCurrency(voucher?.MinOrderAmount)}
                        </td>

                        <td className="td-progress">
                          <div
                            className="position-relative voucher-progress-wrapper"
                            style={{ height: 24 }}
                          >
                            <div
                              className="progress h-100 voucher-progress"
                              style={{ height: "100%" }}
                            >
                              <div
                                className="progress-bar bg-danger"
                                role="progressbar"
                                style={{
                                  width: `${safeProgress}%`,
                                  minWidth: 0,
                                }}
                                aria-valuenow={safeProgress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              />
                            </div>

                            <div
                              className="voucher-progress-text"
                              style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                pointerEvents: "none",
                              }}
                            >
                              <small
                                style={{
                                  color: safeProgress > 30 ? "#fff" : "#000",
                                  fontWeight: 700,
                                }}
                              >
                                {safeProgress.toFixed(1)}%
                              </small>
                            </div>
                          </div>

                          <div className="voucher-progress-count">
                            <small className="text-muted">
                              {claimed}
                              {total ? ` / ${total}` : ""}
                            </small>
                          </div>
                        </td>

                        <td className="td-status">
                          <div>{renderStatus(voucher?.IsActive)}</div>
                          <div className="mt-1">
                            {
                              (() => {
                                const pub = String(voucher?.IsPublic ?? 'private');
                                return (
                                  <span className={`badge ${pub === 'public' ? 'bg-success' : 'bg-secondary'}`}>
                                    {pub === 'public' ? 'Công khai' : 'Riêng tư'}
                                  </span>
                                );
                              })()
                            }
                          </div>
                        </td>

                        <td className="td-date">
                          <div>{formatDateOnly(voucher?.StartDate)}</div>
                          <div className="text-muted">
                            đến {formatDateOnly(voucher?.EndDate)}
                          </div>
                        </td>

                        <td className="td-actions">
                          <div className="voucher-actions d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-dark btn-sm"
                              onClick={() => copyVoucherCode(code)}
                            >
                              Sao chép
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => openEditModal(voucher)}
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteVoucher(voucher)}
                              disabled={deletingVoucherId === String(voucher?.VoucherID ?? voucher?.VoucherId ?? voucher?.ID ?? voucher?.VoucherCode ?? "").trim()}
                            >
                              {deletingVoucherId === String(voucher?.VoucherID ?? voucher?.VoucherId ?? voucher?.ID ?? voucher?.VoucherCode ?? "").trim() ? "Đang xóa..." : "Xóa"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-4">
                      Không có voucher phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherPage;
