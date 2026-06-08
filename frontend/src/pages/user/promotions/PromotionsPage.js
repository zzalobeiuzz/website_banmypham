import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import ProductCard from "../homePage/components/ProductCard";
import "./PromotionsPage.scss";

const resolveBannerUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:image/")) return raw;
  if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
  return `${API_BASE}/uploads/assets/pictures/BannerImage/${raw}`;
};

const resolveProductImage = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return `${UPLOAD_BASE}/pictures/no_image.jpg`;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:image/")) return raw;
  if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
  return `${UPLOAD_BASE}/pictures/${raw.replace(/^\/+/, "")}`;
};

const PromotionProgram = ({ event }) => {
  const sliderRef = useRef(null);
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const products = Array.isArray(event?.products) ? event.products : [];
  const canSlideProducts = products.length > 2;
  const eventKey = String(event?.code || event?.id || "").trim();
  const eventUrl = `/event/${encodeURIComponent(eventKey)}`;

  const getProductSlideDistance = (slider) => {
    const firstItem = slider?.querySelector(".promotion-program__item");
    if (!slider || !firstItem) return 0;

    const styles = window.getComputedStyle(slider);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return firstItem.getBoundingClientRect().width + gap;
  };

  const scrollProducts = (direction) => {
    const slider = sliderRef.current;
    if (!slider) return;

    const distance = getProductSlideDistance(slider) || Math.max(slider.clientWidth * 0.75, 280);
    slider.scrollBy({
      left: direction * distance,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!canSlideProducts) return undefined;

    const intervalId = window.setInterval(() => {
      const slider = sliderRef.current;
      if (!slider) return;

      const distance = getProductSlideDistance(slider);
      if (!distance) return;

      const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
      const nextScrollLeft = slider.scrollLeft + distance;
      const isAtEnd = slider.scrollLeft >= maxScrollLeft - 2;

      slider.scrollTo({
        left: isAtEnd ? 0 : Math.min(nextScrollLeft, maxScrollLeft),
        behavior: "smooth",
      });
    }, 3200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [canSlideProducts, products.length]);

  return (
    <section className={`promotion-program ${expanded ? "is-expanded" : ""}`}>
      <button
        type="button"
        className="promotion-program__open"
        onClick={() => navigate(eventUrl)}
        aria-label="Mở chi tiết sự kiện"
        title="Mở chi tiết sự kiện"
      >
        <span aria-hidden="true" />
      </button>
      <Link to={eventUrl} className="promotion-program__banner">
        {event?.banner_image ? (
          <img src={resolveBannerUrl(event.banner_image)} alt={event.title || "Khuyến mãi"} />
        ) : (
          <div className="promotion-program__banner-empty">{event?.title || "Chương trình khuyến mãi"}</div>
        )}
      </Link>

      <div className="promotion-program__summary">
        <h2>{event?.title || "Chương trình khuyến mãi"}</h2>
        <div className="promotion-program__summary-actions">
          <button
            type="button"
            className="promotion-program__toggle"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-label="Xem sự kiện khuyến mãi"
            title={expanded ? "Thu gọn" : "Xem thông tin"}
          >
            <span aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="promotion-program__content">
        {expanded ? (
          <div className="promotion-program__head">
            <div>
              <span className="promotion-program__code">{event?.code || "SALE EVENT"}</span>
              {event?.description ? <p>{event.description}</p> : null}
              <div className="promotion-program__time">
                {event?.start_date ? new Date(event.start_date).toLocaleDateString("vi-VN") : "--"} - {event?.end_date ? new Date(event.end_date).toLocaleDateString("vi-VN") : "--"}
              </div>
            </div>
          </div>
        ) : null}

        <div className="promotion-program__slider-wrap">
          {canSlideProducts ? (
          <button
            type="button"
            className="promotion-program__nav promotion-program__nav--left"
            onClick={() => scrollProducts(-1)}
            aria-label="Lướt sản phẩm sang trái"
          >
            <span aria-hidden="true" />
          </button>
          ) : null}
          <div className="promotion-program__slider" ref={sliderRef}>
            {products.length > 0 ? (
              products.map((product, index) => (
                <div className="promotion-program__item" key={product.ProductID || index}>
                  <ProductCard
                    item={product}
                    cardIndex={index}
                    detailUrl={`/product/${product.ProductID}`}
                    resolveProductImage={resolveProductImage}
                  />
                </div>
              ))
            ) : (
              <div className="promotion-program__empty-products">
                Chưa có sản phẩm sale trong chương trình này.
              </div>
            )}
          </div>
          {canSlideProducts ? (
          <button
            type="button"
            className="promotion-program__nav promotion-program__nav--right"
            onClick={() => scrollProducts(1)}
            aria-label="Lướt sản phẩm sang phải"
          >
            <span aria-hidden="true" />
          </button>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default function PromotionsPage() {
  const { request } = useHttp();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    request("GET", `${API_BASE}/api/user/events/active-programs?productLimit=10`)
      .then((res) => {
        if (!mounted) return;
        setEvents(Array.isArray(res?.data) ? res.data : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setEvents([]);
        setError(err?.message || "Không thể tải chương trình khuyến mãi.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [request]);

  const totalProducts = useMemo(
    () => events.reduce((sum, event) => sum + (Array.isArray(event?.products) ? event.products.length : 0), 0),
    [events],
  );

  return (
    <main className="promotions-page">
      <section className="promotions-page__hero">
        <div className="promotions-page__hero-main">
          <div>
            <span>Ưu đãi đang diễn ra</span>
            <h1>Khuyến mãi</h1>
            <p>Các chương trình sale đang hoạt động, kèm banner và sản phẩm giảm giá nổi bật.</p>
          </div>
          <div className="promotions-page__hero-side" aria-label="Tóm tắt khuyến mãi">
            <div>
              <strong>{events.length}</strong>
              <span>chương trình</span>
            </div>
            <div>
              <strong>{totalProducts}</strong>
              <span>sản phẩm sale</span>
            </div>
            <div>
              <strong>Đang mở</strong>
              <span>ưu đãi hôm nay</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container promotions-page__body">
        {loading ? (
          <div className="promotions-page__state">Đang tải chương trình khuyến mãi...</div>
        ) : error ? (
          <div className="promotions-page__state is-error">{error}</div>
        ) : events.length === 0 ? (
          <div className="promotions-page__state">Hiện chưa có chương trình khuyến mãi đang diễn ra.</div>
        ) : (
          <div className="promotions-page__grid">
            {events.map((event) => <PromotionProgram event={event} key={event.id} />)}
          </div>
        )}
      </div>
    </main>
  );
}
