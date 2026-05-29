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
   { title: "Giỏ hàng", url: "/cart-detail" },
];

export default function TitleBanner({ option, bannerUrl, bannerAlt, breadcrumbItems }) {
  const breadcrumb = USER_BREADCRUMBS.find((b) => b.title === option);

  const renderBreadcrumbItems = () => {
    // Nếu có breadcrumbItems tùy biến thì render theo chuỗi động do page truyền xuống.
    if (Array.isArray(breadcrumbItems) && breadcrumbItems.length > 0) {
      return breadcrumbItems.map((item, index) => {
        const key = `${item?.title || item?.url || "crumb"}-${index}`;

        return (
          <React.Fragment key={key}>
            {index > 0 && <span className="breadcrumb-sep">&gt;</span>}
            {item?.url ? (
              <Link to={item.url} className={index === 0 ? "breadcrumb-home" : "breadcrumb-option"}>
                {item.title}
              </Link>
            ) : (
              <span className={index === 0 ? "breadcrumb-home" : "breadcrumb-option"}>
                {item?.title}
              </span>
            )}
          </React.Fragment>
        );
      });
    }

    return (
      <>
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
      </>
    );
  };

  return (
    <div className="title-banner-wrapper">
      <div className="title-banner-breadcrumb">
        {renderBreadcrumbItems()}
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
