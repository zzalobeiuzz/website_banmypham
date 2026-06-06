import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
};

const PromotionProgram = ({ event }) => {
  const sliderRef = useRef(null);
  const products = Array.isArray(event?.products) ? event.products : [];
  const eventUrl = `/event/${encodeURIComponent(String(event?.id || ""))}`;

  const scrollProducts = (direction) => {
    const slider = sliderRef.current;
    if (!slider) return;
    const distance = Math.max(slider.clientWidth * 0.75, 280);
    slider.scrollBy({
      left: direction * distance,
      behavior: "smooth",
    });
  };

  return (
    <section className="promotion-program">
      <Link to={eventUrl} className="promotion-program__banner">
        {event?.banner_image ? (
          <img src={resolveBannerUrl(event.banner_image)} alt={event.title || "Khuyến mãi"} />
        ) : (
          <div className="promotion-program__banner-empty">{event?.title || "Chương trình khuyến mãi"}</div>
        )}
      </Link>

      <div className="promotion-program__content">
        <div className="promotion-program__head">
          <div>
            <span className="promotion-program__code">{event?.code || "SALE EVENT"}</span>
            <h2>{event?.title || "Chương trình khuyến mãi"}</h2>
            {event?.description ? <p>{event.description}</p> : null}
            <div className="promotion-program__time">
              {formatDate(event?.start_date) || "--"} - {formatDate(event?.end_date) || "--"}
            </div>
          </div>
          <Link to={eventUrl} className="promotion-program__view-all">Xem tất cả</Link>
        </div>

        <div className="promotion-program__slider-wrap">
          <button
            type="button"
            className="promotion-program__nav promotion-program__nav--left"
            onClick={() => scrollProducts(-1)}
            aria-label="Lướt sản phẩm sang trái"
          >
            &lt;
          </button>
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
              <div className="promotion-program__empty-products">Chưa có sản phẩm sale trong chương trình này.</div>
            )}
          </div>
          <button
            type="button"
            className="promotion-program__nav promotion-program__nav--right"
            onClick={() => scrollProducts(1)}
            aria-label="Lướt sản phẩm sang phải"
          >
            &gt;
          </button>
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
        <div className="container">
          <span>Ưu đãi đang diễn ra</span>
          <h1>Khuyến mãi</h1>
          <p>Các chương trình sale đang hoạt động, kèm banner và sản phẩm giảm giá nổi bật.</p>
          <div className="promotions-page__stats">
            <strong>{events.length}</strong> chương trình
            <strong>{totalProducts}</strong> sản phẩm sale
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
          events.map((event) => <PromotionProgram event={event} key={event.id} />)
        )}
      </div>
    </main>
  );
}
