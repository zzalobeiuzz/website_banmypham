import React, { useEffect, useState } from "react";

const bannerImages = [
  "anh-banner-quang-cao-my-pham-dep_083546254.jpg",
  "beautybox-anh-bia-19-6-2020.jpg",
  "fbddda114634745.603efda33f7ac.jpg",
  "vn-11134210-7qukw-lfva4xrp4453d8.jpg",
];

const Banner = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="section-banner-top mb-4">
      <div className="banner-slide">
        <div className="banner-slick owl-carousel owl-loaded owl-drag">
          <div className="owl-stage-outer">
            <div className="owl-stage">
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
            <button type="button" role="presentation" className="owl-prev">
              <span aria-label="Previous">‹</span>
            </button>
            <button type="button" role="presentation" className="owl-next">
              <span aria-label="Next">›</span>
            </button>
          </div>

          <div className="owl-dots disabled"></div>
        </div>
      </div>

      <div className="banner-wrap">
        <a href="/" aria-label="">
          <img
            src="https://cocolux.com/storage/upload_image/images/banner/700x400.jpg"
            alt=""
            width="390"
            height="195"
            className="img-fluid"
          />
        </a>
        <a href="/" aria-label="">
          <img
            src="https://cocolux.com/storage/upload_image/images/banner/Banner%20-%20700x400px(4).jpg"
            alt=""
            width="390"
            height="195"
            className="img-fluid"
          />
        </a>
      </div>
    </div>
  );
};

export default Banner;
