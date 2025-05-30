import React from "react";

const Banner = () => {
  return (
    <div className="section-banner-top mb-4">
      <div className="banner-slide">
        <div className="banner-slick owl-carousel owl-loaded owl-drag">
          <div className="owl-stage-outer">
            <div className="owl-stage">
              {["anh-banner-quang-cao-my-pham-dep_083546254.jpg", "", 3, 4].map((item, index) => (
                <div className="owl-item" key={index}>
                  <div>
                    <a href="./">
                      <img
                        src={`/assets/images/banner-${item}.jpg`}
                        alt={`Banner ${item}`}
                      />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
