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

const getBannerKey = (event) => {
  const metadata = event?.metadata || {};
  if (metadata.homeBannerSection === "main" && metadata.homeBannerPosition === "center") return "main";
  if (metadata.homeBannerSection === "side" && metadata.homeBannerPosition === "top") return "top";
  if (metadata.homeBannerSection === "side" && metadata.homeBannerPosition === "bottom") return "bottom";
  return "";
};

const Banner = () => {
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
      }
    };

    loadHomeBanners();
    return () => {
      isMounted = false;
    };
  }, []);

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
  const sideBanners = [
    { key: "top", event: sideTopBanner },
    { key: "bottom", event: sideBottomBanner },
  ].filter((item) => item.event);

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
                    <a href="/">
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
        {sideBanners.map(({ key, event }) => (
          <a href="/" key={key} aria-label={event.title || "Banner sự kiện"}>
            <img
              src={resolveBannerUrl(event.banner_image)}
              alt={event.title || ""}
              className="img-fluid"
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </div>
  );
};

export default Banner;
