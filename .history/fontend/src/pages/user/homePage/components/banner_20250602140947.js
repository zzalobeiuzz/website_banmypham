import React, { useEffect, useState } from "react";

// Mảng chứa tên các hình ảnh banner
const bannerImages = [
  "anh-banner-quang-cao-my-pham-dep_083546254.jpg",
  "beautybox-anh-bia-19-6-2020.jpg",
  "fbddda114634745.603efda33f7ac.jpg",
  "vn-11134210-7qukw-lfva4xrp4453d8.jpg",
];

const Banner = () => {
  // State để lưu chỉ số hình ảnh hiện tại (0 -> bannerImages.length - 1)
  const [activeIndex, setActiveIndex] = useState(0);//

  // Tính toán vị trí dịch chuyển (transform) theo chiều ngang để hiển thị ảnh tương ứng
  const translateX = -activeIndex * 710; // 700 là chiều rộng ảnh, 10 là khoảng cách

  // Tự động chuyển ảnh sau mỗi 4 giây
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext(); // chuyển sang ảnh kế tiếp
    }, 4000);

    // Cleanup interval khi component unmount hoặc activeIndex thay đổi
    return () => clearInterval(interval);
  }, [activeIndex]);

  // Hàm chuyển sang ảnh tiếp theo (vòng lặp lại từ đầu nếu vượt quá mảng)
  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
  };

  // Hàm chuyển về ảnh trước đó (quay về ảnh cuối nếu đang ở ảnh đầu)
  const handlePrev = () => {
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? bannerImages.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="section-banner-top mb-4">
      <div className="banner-slide">
        {/* Wrapper chính của carousel */}
        <div className="banner-slick owl-carousel owl-loaded owl-drag">
          <div className="owl-stage-outer">
            <div
              className="owl-stage"
              style={{
                transform: `translate3d(${translateX}px, 0, 0)`, // Dịch chuyển ngang
                transition: "transform 0.25s ease", // Thêm hiệu ứng mượt khi chuyển
              }}
            >
              {/* Duyệt qua từng hình ảnh trong mảng */}
              {bannerImages.map((item, index) => (
                <div
                  className={`owl-item${index === activeIndex ? " active" : ""}`} // Thêm class "active" cho ảnh hiện tại
                  key={index}
                >
                  <div>
                    <a href="./">
                      <img
                        src={`/assets/banner/${item}`} // Đường dẫn ảnh
                        alt={`Banner ${item}`} // Alt mô tả
                      />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nút điều hướng trái/phải */}
          <div className="owl-nav">
            <button
              type="button"
              role="presentation"
              className="owl-prev"
              onClick={handlePrev} // Xử lý khi nhấn nút "trước"
            >
              <span aria-label="Previous">‹</span>
            </button>
            <button
              type="button"
              role="presentation"
              className="owl-next"
              onClick={handleNext} // Xử lý khi nhấn nút "sau"
            >
              <span aria-label="Next">›</span>
            </button>
          </div>

          {/* Bỏ chấm chỉ mục (dots) nếu không cần */}
          <div className="owl-dots disabled"></div>
        </div>
      </div>

      {/* Hai banner nhỏ bên dưới carousel chính */}
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
