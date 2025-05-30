import React from "react";

const Banner = () => {
  return (
    <div className="section-banner-top mb-4">
      <div className="banner-slide">
        <div className="banner-slick owl-carousel owl-loaded owl-drag">
          <div className="owl-stage-outer">
            <div className="owl-stage">
              {["anh-banner-quang-cao-my-pham-dep_083546254.jpg", "beautybox-anh-bia-19-6-2020.jpg", 
              "fbddda114634745.603efda33f7ac.jpg", "vn-11134210-7qukw-lfva4xrp4453d8.jpg"].map((item, index) => (
                <div className="owl-item" key={index}>
                  <div>
                    <a href="./">
                      <img
                        src={`/assets/banner/S-${item}`}
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
