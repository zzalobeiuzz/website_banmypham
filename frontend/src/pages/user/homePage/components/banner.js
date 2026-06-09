import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../../constants";

const resolveBannerUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:image/")) return raw;
  if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
  return `${API_BASE}/uploads/assets/pictures/BannerImage/${raw}`;
};

const emptyBannerSrc =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='390' height='195' viewBox='0 0 390 195'%3E%3C/svg%3E";

const getEventUrl = (event) => `/event/${encodeURIComponent(String(event?.code || event?.id || "").trim())}`;

const getBannerKey = (event) => {
  const slot = String(event?.homeBannerSlot || "").trim().toLowerCase();
  if (["main", "top", "bottom"].includes(slot)) return slot;

  let metadata = event?.metadata || {};
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata);
    } catch {
      metadata = {};
    }
  }

  const section = String(metadata.homeBannerSection || "").trim().toLowerCase();
  const position = String(metadata.homeBannerPosition || "").trim().toLowerCase();

  if (
    (section === "main" && position === "center") ||
    position === "main" ||
    position === "banner-slide"
  ) {
    return "main";
  }

  if (
    (section === "side" && position === "top") ||
    section === "top" ||
    position === "top" ||
    position === "side_top"
  ) {
    return "top";
  }

  if (
    (section === "side" && position === "bottom") ||
    section === "bottom" ||
    position === "bottom" ||
    position === "side_bottom"
  ) {
    return "bottom";
  }
  return "";
};

const Banner = ({ onReady }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [homeBanners, setHomeBanners] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadHomeBanners = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/user/events/home-banners`);
        const json = await response.json();
        if (!isMounted) return;
        setHomeBanners(Array.isArray(json?.data) ? json.data : []);
      } catch (error) {
        if (isMounted) setHomeBanners([]);
      } finally {
        if (isMounted) onReady?.();
      }
    };

    loadHomeBanners();
    return () => {
      isMounted = false;
    };
  }, [onReady]);

  const { mainBanners, sideTopBanner, sideBottomBanner } = useMemo(() => {
    const grouped = {
      mainBanners: [],
      sideTopBanner: null,
      sideBottomBanner: null,
    };

    homeBanners.forEach((event) => {
      const key = getBannerKey(event);
      if (key === "main") grouped.mainBanners.push(event);
      if (key === "top" && !grouped.sideTopBanner) grouped.sideTopBanner = event;
      if (key === "bottom" && !grouped.sideBottomBanner) grouped.sideBottomBanner = event;
    });

    return grouped;
  }, [homeBanners]);

  useEffect(() => {
    if (mainBanners.length <= 1) return undefined;

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % mainBanners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [mainBanners.length]);

  useEffect(() => {
    if (activeIndex >= mainBanners.length) setActiveIndex(0);
  }, [activeIndex, mainBanners.length]);

  if (mainBanners.length === 0 && !sideTopBanner && !sideBottomBanner) {
    return null;
  }

  const translateX = -activeIndex * 710;

  const handleNext = () => {
    if (mainBanners.length <= 1) return;
    setActiveIndex((prevIndex) => (prevIndex + 1) % mainBanners.length);
  };

  const handlePrev = () => {
    if (mainBanners.length <= 1) return;
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? mainBanners.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="section-banner-top mb-4">
      <div className="banner-slide">
        <div className="banner-slick owl-carousel owl-loaded owl-drag">
          <div className="owl-stage-outer">
            <div
              className="owl-stage"
              style={{
                transform: `translate3d(${translateX}px, 0, 0)`,
                transition: "transform 0.25s ease",
                width: mainBanners.length * 700 + Math.max(0, mainBanners.length - 1) * 10 + "px",
              }}
            >
              {mainBanners.map((event, index) => (
                <div
                  className={`owl-item${index === activeIndex ? " active" : ""}`}
                  key={event.id || index}
                >
                  <div>
                    <a href={getEventUrl(event)}>
                      <img
                        src={resolveBannerUrl(event.banner_image)}
                        alt={event.title || "Banner sự kiện"}
                        loading="lazy"
                      />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {mainBanners.length > 1 ? (
            <div className="owl-nav">
              <button
                type="button"
                role="presentation"
                className="owl-prev"
                onClick={handlePrev}
              >
                <span aria-label="Previous">‹</span>
              </button>
              <button
                type="button"
                role="presentation"
                className="owl-next"
                onClick={handleNext}
              >
                <span aria-label="Next">›</span>
              </button>
            </div>
          ) : null}

          <div className="owl-dots disabled"></div>
        </div>
      </div>

      <div className="banner-wrap">
        {sideTopBanner ? (
          <a href={getEventUrl(sideTopBanner)} className="banner-wrap__slot banner-wrap__slot--top" aria-label={sideTopBanner.title || "Banner sự kiện"}>
            <img
              src={resolveBannerUrl(sideTopBanner.banner_image)}
              alt={sideTopBanner.title || ""}
              className="img-fluid"
              loading="lazy"
            />
          </a>
        ) : (
          <a href="/" className="banner-wrap__slot banner-wrap__slot--top banner-wrap__slot--empty" aria-hidden="true" tabIndex={-1}>
            <img src={emptyBannerSrc} alt="" className="img-fluid" loading="lazy" />
          </a>
        )}

        {sideBottomBanner ? (
          <a href={getEventUrl(sideBottomBanner)} className="banner-wrap__slot banner-wrap__slot--bottom" aria-label={sideBottomBanner.title || "Banner sự kiện"}>
            <img
              src={resolveBannerUrl(sideBottomBanner.banner_image)}
              alt={sideBottomBanner.title || ""}
              className="img-fluid"
              loading="lazy"
            />
          </a>
        ) : (
          <a href="/" className="banner-wrap__slot banner-wrap__slot--bottom banner-wrap__slot--empty" aria-hidden="true" tabIndex={-1}>
            <img src={emptyBannerSrc} alt="" className="img-fluid" loading="lazy" />
          </a>
        )}
      </div>
    </div>
  );
};

export default Banner;
