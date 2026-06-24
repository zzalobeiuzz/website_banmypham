import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./UserBreadcrumbBar.scss";

const PRODUCT_TYPE_TITLES = {
  all: "Tất cả sản phẩm",
  "flash-sale": "Flash Sale",
  "hot-products": "Sản phẩm hot",
  "new-arrivals": "Hàng mới về",
  "featured-brands": "Thương hiệu nổi bật",
};

const ROUTE_TITLES = {
  promotions: "Khuyến mãi",
  about: "Giới thiệu",
  contact: "Liên hệ",
  support: "Hỗ trợ khách hàng",
  "san-pham-ban-chay": "Sản phẩm bán chạy",
  "he-thong-cua-hang": "Hệ thống cửa hàng",
  "order-lookup": "Tra cứu đơn hàng",
  profile: "Tài khoản",
  "cart-detail": "Giỏ hàng",
};

const decodePathPart = (value) => {
  try {
    return decodeURIComponent(String(value || "").replace(/\+/g, " "));
  } catch {
    return String(value || "");
  }
};

const buildBreadcrumbItems = (pathname, search) => {
  const cleanPath = pathname.replace(/\/+$/, "");
  const segments = cleanPath.split("/").filter(Boolean);
  const searchParams = new URLSearchParams(search);

  if (segments.length === 0) return [];

  const [first, second] = segments;

  if (first === "all-products") {
    const pageTitle = PRODUCT_TYPE_TITLES[second] || decodePathPart(second) || "Sản phẩm";
    const items = [{ title: pageTitle }];
    const subCategory = searchParams.get("subCategory");

    if (subCategory && subCategory !== "all") {
      items.push({ title: decodePathPart(subCategory) });
    }

    return items;
  }

  if (first === "event") {
    return [
      { title: "Sự kiện", url: "/promotions" },
      { title: decodePathPart(second) || "Chi tiết sự kiện" },
    ];
  }

  if (first === "product") {
    return [{ title: "Chi tiết sản phẩm" }];
  }

  if (first === "brand") {
    return [{ title: "Thương hiệu" }];
  }

  return [{ title: ROUTE_TITLES[first] || decodePathPart(first) }];
};

const UserBreadcrumbBar = () => {
  const location = useLocation();
  const items = buildBreadcrumbItems(location.pathname, location.search);

  if (items.length === 0) return null;

  return (
    <nav className="user-breadcrumb-bar" aria-label="Đường dẫn trang">
      <div className="user-breadcrumb-bar__inner">
        <Link to="/" className="user-breadcrumb-bar__home">
          Trang chủ
        </Link>
        {items.map((item, index) => (
          <React.Fragment key={`${item.title}-${index}`}>
            <span className="user-breadcrumb-bar__sep">&gt;</span>
            {item.url ? (
              <Link to={item.url} className="user-breadcrumb-bar__item">
                {item.title}
              </Link>
            ) : (
              <span className="user-breadcrumb-bar__item">{item.title}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default UserBreadcrumbBar;
