import React, { useEffect, useState } from "react";

const bannerImages = [
  "anh-banner-quang-cao-my-pham-dep_083546254.jpg",
  "beautybox-anh-bia-19-6-2020.jpg",
  "fbddda114634745.603efda33f7ac.jpg",
  "vn-11134210-7qukw-lfva4xrp4453d8.jpg",
];

const Banner = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const translateX = -activeIndex * 710; // 700 width + 10 margin

  // Tự động chuyển ảnh sau mỗi 4s
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex]); // cần cập nhật lại interval khi activeIndex thay đổi

  // Xử lý chuyển ảnh tiếp theo
  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
  };

  // Xử lý chuyển ảnh trước đó
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
                        src={`/assets/banner/${item}`}
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
        <a href="/" aria-label="">
          <img src="./assets/banner/OIP.jpg" alt="" className="img-fluid" />
        </a>
        <a href="/" aria-label="">
          <img
            src="./assets/banner/1803ba3fbfca9f67ed6e64143c28815c.jpg"
            alt=""
            className="img-fluid"
          />
        </a>
      </div>
    </div>
  );
};

export default Banner;
