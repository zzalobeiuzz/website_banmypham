import React, { useEffect, useRef, useState } from "react";

const isBrandActive = (status) =>
  status === 1 ||
  status === "1" ||
  String(status).toLowerCase() === "active" ||
  String(status).toLowerCase() === "true";

const BrandDetailPopup = ({ brand, onClose, resolveBrandLogoUrl }) => {
  const detailModalBodyRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!brand) {
      setShowScrollTop(false);
      return;
    }

    const detailBody = detailModalBodyRef.current;
    if (!detailBody) {
      setShowScrollTop(false);
      return;
    }

    const handleDetailScroll = () => {
      setShowScrollTop(detailBody.scrollTop > 120);
    };

    detailBody.addEventListener("scroll", handleDetailScroll, { passive: true });
    handleDetailScroll();

    return () => {
      detailBody.removeEventListener("scroll", handleDetailScroll);
    };
  }, [brand]);

  if (!brand) return null;

  const logoUrl = resolveBrandLogoUrl(brand.logo_url);
  const active = isBrandActive(brand.status);

  const handleScrollToTop = () => {
    const detailBody = detailModalBodyRef.current;
    if (detailBody) {
      detailBody.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="brand-detail-modal" onClick={onClose}>
      <div className="brand-detail-modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="brand-detail-modal__header">
          <h3>Chi tiết thương hiệu</h3>
          <button type="button" className="brand-detail-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        {showScrollTop && (
          <button
            type="button"
            className="brand-detail-scroll-top"
            onClick={handleScrollToTop}
            aria-label="Lên đầu popup"
            title="Lên đầu popup"
          >
            ↑
          </button>
        )}

        <div ref={detailModalBodyRef} className="brand-detail-modal__body">
          <div className="brand-detail-form">
            <div className="brand-detail-top">
              <div className="brand-detail-logo-wrap">
                <div className="brand-detail-logo-box">
                  {logoUrl ? (
                    <img className="brand-detail-logo-img" src={logoUrl} alt={brand.idBrand || "brand"} />
                  ) : (
                    <div className="brand-detail-logo-empty">Không có logo</div>
                  )}
                </div>
              </div>

              <div className="brand-detail-info-wrap">
                <div className="brand-detail-info-item">
                  <label>ID Brand</label>
                  <div className="brand-detail-value">{brand.idBrand || "N/A"}</div>
                </div>

                <div className="brand-detail-info-item">
                  <label>Tên thương hiệu</label>
                  <div className="brand-detail-value">{brand.Brand || brand.name || "N/A"}</div>
                </div>

                <div className="brand-detail-info-item">
                  <label>Trạng thái</label>
                  <div className="brand-detail-value">
                    <span className={`brand-status ${active ? "active" : "inactive"}`}>
                      {active ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="brand-detail-bottom">
              <label>Mô tả</label>
              <div className="brand-detail-modal__description">
                {brand.description ? (
                  <div
                    className="brand-detail-modal__html"
                    dangerouslySetInnerHTML={{ __html: brand.description }}
                  />
                ) : (
                  <p>Không có mô tả.</p>
                )}
              </div>
            </div>

            <div className="brand-detail-modal__actions">
              <button type="button" className="brand-btn-detail-close" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDetailPopup;
