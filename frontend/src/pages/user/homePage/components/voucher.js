import React, { useEffect, useMemo, useRef, useState } from "react";
import lottie from "lottie-web";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import giftAnimation from "../../../../animation/gift.json";
import "./componets.scss";

/*
  File: voucher.js
  Mục đích: Hiển thị danh sách voucher, modal chi tiết voucher và xử lý sao chép mã.

  Chú thích chính (tiếng Việt):
  - Các hàm helper: formatProgress, getProgressData, formatDateOnly, formatCurrency
    dùng để chuẩn hoá dữ liệu hiển thị (phần trăm, ngày, tiền).
  - Component `VoucherItem`: 1 item trong carousel, có nút "Chi tiết" và "Sao chép".
  - Component chính `Voucher`: lấy dữ liệu voucher từ API, quản lý trạng thái
    (selectedVoucher, copiedCode, copyMessage) và hiển thị popup chi tiết.
*/

// Chuyển giá trị tiến độ (có thể là chuỗi hoặc số) thành số trong khoảng 0-100
const formatProgress = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(number, 100));
};

// Tính toán dữ liệu tiến độ từ object voucher
// - Hỗ trợ nhiều tên trường khác nhau (claimedCount, claimed, totalQuota, quota,...)
// - Nếu object có trường progress hoặc ProgressPct thì ưu tiên dùng trực tiếp
// - Nếu không có, tính theo claimed / total (nếu total > 0)
const getProgressData = (voucher) => {
  if (!voucher) return { percent: 0, claimed: 0, total: 0 };

  const claimed = Number(voucher.claimedCount ?? voucher.claimed ?? 0) || 0;
  const total =
    Number(voucher.totalQuota ?? voucher.quota ?? voucher.total ?? 0) || 0;

  // Nếu có trường tiến độ rõ ràng thì dùng, ngược lại tính từ claimed/total
  let rawProgress = undefined;
  if (voucher.progress !== undefined && voucher.progress !== null) {
    rawProgress = Number(voucher.progress);
  } else if (
    voucher.ProgressPct !== undefined &&
    voucher.ProgressPct !== null
  ) {
    rawProgress = Number(voucher.ProgressPct);
  } else if (total > 0) {
    rawProgress = (claimed / total) * 100;
  } else {
    rawProgress = 0;
  }

  const percent = formatProgress(rawProgress);
  return { percent, claimed, total };
};

// Định dạng ngày chỉ còn ngày/tháng/năm theo locale vi-VN
const formatDateOnly = (value) => {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

// Định dạng tiền theo chuẩn Việt Nam và thêm hậu tố "đ"
const formatCurrency = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0đ";

  return `${number.toLocaleString("vi-VN")}đ`;
};

const GiftCouponLottie = () => {
  const animationRef = useRef(null);

  useEffect(() => {
    if (!animationRef.current) return undefined;

    const anim = lottie.loadAnimation({
      container: animationRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: giftAnimation,
    });

    return () => {
      anim.destroy();
    };
  }, []);

  return (
    <div
      ref={animationRef}
      className="coupon-gift-lottie"
      aria-hidden="true"
    />
  );
};

// Component hiển thị 1 voucher trong carousel
// - Hiển thị tiêu đề, mô tả ngắn, thanh tiến độ và các nút hành động
const VoucherItem = ({ voucher, onOpenDetail, onCopyCode, copiedCode }) => {
  const { percent: progress } = getProgressData(voucher);
  const isCopied = copiedCode === voucher.code;

  return (
    <div className="owl-item active" style={{ width: "330px" }}>
      <div className="item-coupon">
        <div className="d-flex align-items-center justify-content-between">
          <div className="box-coupon box-coupon-left text-center">
            <GiftCouponLottie />
          </div>
          <div className="box-coupon box-coupon-right w-100">
            <p className="sub-title-coupon">{voucher.title}</p>
            <div className="voucher-detail pb-2">{voucher.detail}</div>

            {/* Thanh tiến độ hiển thị tỉ lệ phần trăm */}
            <div className="progress">
              <div
                className="progress-bar bg-danger"
                role="progressbar"
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-1">
              {/* Mở modal chi tiết */}
              <button
                type="button"
                className="btn btn-call-modal p-0 btn-value"
                onClick={() => onOpenDetail(voucher)}
              >
                Chi tiết
              </button>

              {/* Nút sao chép mã; khi đã sao chép sẽ hiển thị trạng thái khác */}
              <button
                type="button"
                className="btn btn-dark btn-copy"
                onClick={() => onCopyCode(voucher.code)}
              >
                {isCopied ? "Đã sao chép" : "Sao chép"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Voucher = () => {
  // Hook lấy request wrapper (custom) để gọi API
  const { request } = useHttp();

  // State chính
  const [vouchers, setVouchers] = useState([]); // danh sách voucher
  const [loading, setLoading] = useState(true); // trạng thái loading

  // Ref để điều khiển scroll carousel
  const outerRef = useRef(null);

  // Timers và trạng thái sao chép
  const copyToastTimerRef = useRef(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null); // voucher đang xem chi tiết
  const [copyMessage, setCopyMessage] = useState(""); // message toast khi sao chép
  const [copiedCode, setCopiedCode] = useState(""); // lưu mã vừa sao chép

  // Lấy tiến độ của voucher đang chọn (để hiển thị trong modal)
  const { percent: selectedProgress } = getProgressData(selectedVoucher);

  const handleOpenDetail = (voucher) => {
    // Mở modal chi tiết cho voucher được chọn
    setSelectedVoucher(voucher);
  };

  const handleCloseDetail = () => {
    // Đóng modal chi tiết
    setSelectedVoucher(null);
  };

  const showCopyToast = (message) => {
    // Hiện thông báo nhỏ (toast) khi sao chép mã
    setCopyMessage(message);

    if (copyToastTimerRef.current) {
      clearTimeout(copyToastTimerRef.current);
    }

    // Ẩn sau 2.2s
    copyToastTimerRef.current = window.setTimeout(() => {
      setCopyMessage("");
      copyToastTimerRef.current = null;
    }, 2200);
  };

  const handleCopyCode = async (code) => {
    if (!code) return;

    try {
      // Dùng Clipboard API nếu trình duyệt hỗ trợ
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        setCopiedCode(code);
        showCopyToast("Đã sao chép mã voucher. Bạn có thể Ctrl+V để sử dụng.");
        return;
      }

      // Fallback: vẫn set trạng thái copy nhưng không thực sự copy
      setCopiedCode(code);
      showCopyToast("Đã sao chép mã voucher. Bạn có thể Ctrl+V để sử dụng.");
    } catch (error) {
      // Ghi log nếu có lỗi (không block UI)
      console.error("Không thể sao chép mã voucher:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (copyToastTimerRef.current) {
        clearTimeout(copyToastTimerRef.current);
      }
    };
  }, []);

  // Lần đầu mount: gọi API để lấy danh sách voucher
  useEffect(() => {
    let mounted = true;

    const fetchVouchers = async () => {
      try {
        setLoading(true);
        const res = await request("GET", `${API_BASE}/api/user/vouchers`);

        if (!mounted) return;

        const data = res?.data || [];
        setVouchers(Array.isArray(data) ? data : []);
      } catch (error) {
        if (mounted) setVouchers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVouchers();

    // Cleanup khi unmount
    return () => {
      mounted = false;

      if (copyToastTimerRef.current) {
        clearTimeout(copyToastTimerRef.current);
      }
    };
  }, [request]);

  const visibleVouchers = useMemo(() => vouchers, [vouchers]);
  const showNavButtons = visibleVouchers.length > 4;

  // Scroll handler cho carousel
  // - Dùng width cố định `itemWidth` để tránh reflow khi đo bằng getBoundingClientRect
  // - Scroll một item mỗi lần và loop về đầu/cuối khi cần
  const scrollStage = (direction) => {
    if (!outerRef.current) return;
    const outer = outerRef.current;

    // Keep in sync with `.owl-item { width: 330px }` in `componets.scss`
    const itemWidth = 330;
    const distance = itemWidth; // one item per click
    const maxScrollLeft = Math.max(0, outer.scrollWidth - outer.clientWidth);
    const currentScrollLeft = outer.scrollLeft;

    let targetScrollLeft = currentScrollLeft;

    if (direction === "left") {
      // If near start, loop to end
      if (currentScrollLeft <= itemWidth * 0.5) {
        targetScrollLeft = maxScrollLeft;
      } else {
        targetScrollLeft = Math.max(0, currentScrollLeft - distance);
      }
    } else {
      // If near end, loop to start
      if (currentScrollLeft >= maxScrollLeft - itemWidth * 0.5) {
        targetScrollLeft = 0;
      } else {
        targetScrollLeft = Math.min(
          maxScrollLeft,
          currentScrollLeft + distance,
        );
      }
    }

    outer.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
  };

  return (
    <div className="list-coupon position-relative">
      {showNavButtons ? (
        <button
          type="button"
          className="btn btn-light voucher-nav-btn voucher-nav-btn-left"
          onClick={() => scrollStage("left")}
          aria-label="Lướt voucher sang trái"
        >
          ‹
        </button>
      ) : null}
      <h2 className="text-center">Mã khuyến mại</h2>

      <div className="voucher-carousel-wrap">
        <div className="slide-main-coupon">
          <div className="slide-template-slide-coupon owl-carousel justify-content-center owl-loaded owl-drag position-relative">
            <div ref={outerRef} className="owl-stage-outer">
              {/* removed 'overflow-hidden' from this element so the outer container
                    (`.owl-stage-outer`) can manage horizontal scrolling via JS */}
              <div className="owl-stage d-flex">
                {!loading && visibleVouchers.length > 0 ? (
                  visibleVouchers.map((voucher) => (
                    <VoucherItem
                      key={voucher.id}
                      voucher={voucher}
                      onOpenDetail={handleOpenDetail}
                      onCopyCode={handleCopyCode}
                      copiedCode={copiedCode}
                    />
                  ))
                ) : (
                  <div className="text-center w-100 py-4 text-muted">
                    {loading
                      ? "Đang tải voucher..."
                      : "Chưa có voucher công khai."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNavButtons ? (
        <button
          type="button"
          className="btn btn-light voucher-nav-btn voucher-nav-btn-right"
          onClick={() => scrollStage("right")}
          aria-label="Lướt voucher sang phải"
        >
          ›
        </button>
      ) : null}

      {/* =================== POPUP HIỂN THỊ CHI TIẾT VOUCHER ====================== */}
      {selectedVoucher ? (
        <div
          className="modal modal-voucher fade show"
          style={{ display: "block" }}
          role="dialog"
          aria-modal="true"
          onClick={handleCloseDetail}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <div className="modal-title-block">
                  <div className="modal-title-label">Chi tiết</div>
                  <div className="modal-title-input">
                    {selectedVoucher.title || selectedVoucher.code || (
                      <span className="placeholder">Chưa có thông tin</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Đóng"
                  onClick={handleCloseDetail}
                />
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  {selectedVoucher.detail ||
                    "Không có mô tả chi tiết cho voucher này."}
                </p>
                <div className="d-grid gap-2">
                  <div>
                    <strong>Mã:</strong>
                    <span className="value">
                      {selectedVoucher.code || "--"}
                    </span>
                  </div>
                  <div>
                    <strong>Giảm giá:</strong>
                    <span className="value">
                      {formatCurrency(selectedVoucher.discountAmount)}
                    </span>
                  </div>
                  <div>
                    <strong>Đơn tối thiểu:</strong>
                    <span className="value">
                      {formatCurrency(selectedVoucher.minOrderAmount)}
                    </span>
                  </div>
                  <div className="voucher-detail-progress">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <strong>Tiến độ sử dụng</strong>
                    </div>

                    <div className="position-relative voucher-progress-wrapper">
                      <div className="progress h-100">
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${selectedProgress}%`,
                          }}
                          aria-valuenow={selectedProgress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>

                      <div
                        className={`voucher-progress-text ${
                          selectedProgress <= 30 ? "small--light" : ""
                        }`}
                      >
                        <small>{selectedProgress.toFixed(1)}%</small>
                      </div>
                    </div>

                    {/* progress info removed: replaced by percent inside the bar */}
                  </div>
                  <div>
                    <strong>Hiệu lực:</strong>
                    <span className="value">
                      {(() => {
                        const start = selectedVoucher.startDate || selectedVoucher.fromDate || selectedVoucher.createdAt;
                        const end = selectedVoucher.endDate || selectedVoucher.toDate || selectedVoucher.expiresAt;
                        const startStr = formatDateOnly(start);
                        const endStr = formatDateOnly(end);
                        if (start && end) return `${startStr} — ${endStr}`;
                        if (start) return startStr;
                        if (end) return endStr;
                        return "--";
                      })()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCloseDetail}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => handleCopyCode(selectedVoucher.code)}
                >
                  {copiedCode === selectedVoucher.code ? "Đã sao chép" : "Sao chép mã"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {copyMessage ? (
        <div className="voucher-copy-toast" role="status" aria-live="polite">
          {copyMessage}
        </div>
      ) : null}
    </div>
  );
};

export default Voucher;
