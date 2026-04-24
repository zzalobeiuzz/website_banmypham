import React from "react";
import "./TitleBanner.scss";
import { Link } from "react-router-dom";

// Khai báo trực tiếp mảng breadcrumb cho user
const USER_BREADCRUMBS = [
  { title: "Trang chủ", url: "/" },
  { title: "Flash Sale", url: "/all-products/flash-sale" },
  { title: "Sản phẩm hot", url: "/all-products/hot-products" },
  { title: "Thương hiệu nổi bật", url: "/all-products/featured-brands" },
  { title: "Chi tiết sản phẩm", url: "/product/:id" },
  { title: "Chi tiết thương hiệu", url: "/brand/:idBrand" },
  { title: "Profile", url: "/profile" },
  { title: "Đăng ký", url: "/signup" },
];

export default function TitleBanner({ option, bannerUrl, bannerAlt }) {
  const breadcrumb = USER_BREADCRUMBS.find((b) => b.title === option);
  return (
    <div className="title-banner-wrapper">
      <div className="title-banner-breadcrumb">
        <Link to="/" className="breadcrumb-home">
          Trang chủ
        </Link>
        <span className="breadcrumb-sep">&gt;</span>
        {breadcrumb?.url && breadcrumb.url !== "/" ? (
          <Link to={breadcrumb.url} className="breadcrumb-option">
            {option}
          </Link>
        ) : (
          <span className="breadcrumb-option">{option}</span>
        )}
      </div>
      <div className="title-banner-center">
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt={bannerAlt || option}
            className="title-banner-img"
          />
        )}
      </div>
    </div>
  );
}
