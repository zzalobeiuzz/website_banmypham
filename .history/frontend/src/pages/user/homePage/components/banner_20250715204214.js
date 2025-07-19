import React, { useEffect, useState } from "react";
import { UPLOAD_BASE } from "../../../../constants";

// Mảng chứa tên file banner chính
const bannerImages = [
  "anh-banner-quang-cao-my-pham-dep_083546254.jpg",
  "beautybox-anh-bia-19-6-2020.jpg",
  "fbddda114634745.603efda33f7ac.jpg",
  "vn-11134210-7qukw-lfva4xrp4453d8.jpg",
];

// Mảng chứa tên file banner nhỏ bên dưới (nếu muốn quản lý động luôn)
const smallBanners = [
  "OIP.jpg",
  "1803ba3fbfca9f67ed6e64143c28815c.jpg",
];

const Banner = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Tính transform
  const translateX = -activeIndex * 710;

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? bannerImages.length - 1 : prevIndex - 1
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
                width: bannerImages.length * 700 + (bannerImages.length - 1) * 10 + "px",
              }}
            >
              {bannerImages.map((item, index) => (
                <div
                  className={`owl-item${index === activeIndex ? " active" : ""}`}
                  key={index}
                >
                  <div>
                    <a href="./">
                      <img
                        src={`${UPLOAD_BASE}/assets/banner/${item}`}
                        alt={`Banner ${item}`}
                      />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

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

          <div className="owl-dots disabled"></div>
        </div>
      </div>

      <div className="banner-wrap">
        {smallBanners.map((item, index) => (
          <a href="/" key={index} aria-label="">
            <img
              src={`${UPLOAD_BASE}/assets/banner/${item}`}
              alt=""
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
