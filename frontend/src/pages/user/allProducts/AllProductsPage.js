import React, { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";
import { useParams, useSearchParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import "./AllProductsPage.scss";
import BrandProductFilter from "../homePage/components/ProductFilter";
import TitleBanner from "../homePage/components/TitleBanner";
import ProductCard from "../homePage/components/ProductCard";
import { ROUTERS } from "../../../utils/router";
import noProductAnimation from "../../../animation/no_product.json";

const NoProductLottie = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let anim = null;

    if (containerRef.current) {
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        animationData: noProductAnimation,
      });
    }

    return () => {
      if (anim) anim.destroy();
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "42vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: 440,
          height: 440,
          overflow: "hidden",
        }}
      />
      <div
        style={{
          color: "#64748b",
          fontWeight: 600,
          fontSize: 18,
          textAlign: "center",
        }}
      >
        Không có sản phẩm phù hợp
      </div>
    </div>
  );
};

const TITLE_MAP = {
  "flash-sale": {
    title: "Flash Sale",
    api: `${API_BASE}/api/user/products/sale`,
  },
  "hot-products": {
    title: "Sản phẩm hot",
    api: `${API_BASE}/api/user/products/hot`,
  },
  "featured-brands": {
    title: "Thương hiệu nổi bật",
    api: `${API_BASE}/api/user/products/brands`,
  },
  all: {
    title: "Tất cả sản phẩm",
    api: `${API_BASE}/api/user/products/loadAllProducts`,
  },
};

const EVENT_ACCENT_COLORS = [
  "#0f766e",
  "#2563eb",
  "#db2777",
  "#ea580c",
  "#7c3aed",
  "#0891b2",
  "#16a34a",
  "#dc2626",
];

const getRandomEventAccentColor = () => {
  const randomIndex = Math.floor(Math.random() * EVENT_ACCENT_COLORS.length);
  return EVENT_ACCENT_COLORS[randomIndex];
};

const hexToRgb = (hex) => {
  const normalized = String(hex || "").replace("#", "");
  const value = parseInt(normalized, 16);

  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
};

export default function AllProductsPage() {
  const { type, eventId } = useParams();
  const [searchParams] = useSearchParams();
  const { request } = useHttp();
  const [products, setProducts] = useState([]);
  const [eventDetail, setEventDetail] = useState(null);
  const [eventInfoVisible, setEventInfoVisible] = useState(true);
  const [eventAccentColor, setEventAccentColor] = useState(() => getRandomEventAccentColor());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [sortBy, setSortBy] = useState("default");
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState([0, 10000000]);
  const [saleOnly, setSaleOnly] = useState(false);
  // Đóng/mở panel bộ lọc
  const [filterPanelVisible, setFilterPanelVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Lấy danh sách category từ products
  const categories = React.useMemo(() => {
    const cats = new Set(["all"]);
    products.forEach((p) => {
      if (p.CategoryName) cats.add(p.CategoryName);
    });
    return Array.from(cats);
  }, [products]);

  // type có thể là key cứng (flash-sale/hot-products/...) hoặc tên category động từ header.
  const decodedType = decodeURIComponent(String(type || "")).trim();
  const isMappedType = Boolean(TITLE_MAP[type]);
  const isCategoryType = Boolean(decodedType) && !isMappedType;
  const isEventPage = Boolean(eventId);

  // Đồng bộ category/subCategory từ query string hoặc từ :type khi mở từ menu danh mục ở header.
  useEffect(() => {
    // Đồng bộ trạng thái filter từ query string: category, subCategory và searchText.
    // Khi header submit tìm kiếm sẽ set `searchText` trong URL, page này sẽ đọc
    // `searchText` và lọc danh sách sản phẩm phía client theo từ khóa đó.
    const queryCategory = String(searchParams.get("category") || "").trim();
    const querySubCategory = String(searchParams.get("subCategory") || "").trim();
    const querySearchText = String(searchParams.get("searchText") || "").trim();
    const typeCategory = isCategoryType ? decodedType : "";
    const initialCategory = queryCategory || typeCategory;

    if (!initialCategory) {
      setSelectedCategory("all");
    } else {
      const matchedCategory = categories.find(
        (item) => String(item || "").toLowerCase() === initialCategory.toLowerCase(),
      );
      setSelectedCategory(matchedCategory || initialCategory);
    }

    if (!querySubCategory) {
      setSelectedSubCategory("all");
    } else {
      setSelectedSubCategory(querySubCategory);
    }

    // Đồng bộ từ khóa tìm kiếm (nếu có) vào state `searchText` để bộ lọc hoạt động.
    setSearchText(querySearchText);
  }, [searchParams, categories, decodedType, isCategoryType]);

  const PRICE_MIN_LIMIT = 0;
  const PRICE_MAX_LIMIT = 10000000;
  const PRICE_STEP = 100000;
  const formatVndShort = (v) =>
    v >= 1000000
      ? (v / 1000000).toFixed(1) + "tr"
      : v.toLocaleString("vi-VN") + "đ";

  // URL cho cấp category: breadcrumb sẽ quay về trang danh mục cha.
  const buildCategoryPageUrl = (categoryName) => {
    const normalizedCategory = String(categoryName || "").trim();
    if (!normalizedCategory || normalizedCategory === "all") return "/";
    return `/${"all-products"}/${encodeURIComponent(normalizedCategory)}`;
  };

  // URL cho cấp subcategory: giữ cả category + subCategory để trang lọc đúng 2 tầng.
  const buildSubCategoryPageUrl = (categoryName, subCategoryName) => {
    const normalizedCategory = String(categoryName || "").trim();
    const normalizedSubCategory = String(subCategoryName || "").trim();
    if (!normalizedCategory || normalizedCategory === "all") return "/";

    const basePath = `/${"all-products"}/${encodeURIComponent(normalizedCategory)}`;
    if (!normalizedSubCategory || normalizedSubCategory === "all") return basePath;

    return `${basePath}?category=${encodeURIComponent(normalizedCategory)}&subCategory=${encodeURIComponent(normalizedSubCategory)}`;
  };

  // Nếu là category động: dùng API loadAllProducts rồi filter phía client theo selectedCategory.
  const config =
    TITLE_MAP[type] ||
    (isCategoryType
      ? {
          title: decodedType,
          api: `${API_BASE}/api/user/products/loadAllProducts`,
        }
      : TITLE_MAP["flash-sale"]);

  const bannerBreadcrumbItems = React.useMemo(() => {
    const items = [{ title: "Trang chủ", url: "/" }];
    const categoryTitle = String(selectedCategory || "").trim();
    const subCategoryTitle = String(selectedSubCategory || "").trim();
    // Nếu có từ khóa tìm kiếm (searchText) thì ưu tiên hiển thị breadcrumb của tìm kiếm
    const rawPageTitle = String(config?.title || "").trim();
    const pageTitle = searchText ? `Tìm kiếm: ${searchText}` : rawPageTitle;
    const shouldUseCategoryPathBreadcrumb = isCategoryType || categoryTitle !== "all" || subCategoryTitle !== "all";

    if (isEventPage) {
      items.push({ title: eventDetail?.title || "Sự kiện", url: null });
      return items;
    }

    // Với route động theo category/subcategory thì chỉ giữ chuỗi: Trang chủ > Category > Subcategory.
    // Nếu có từ khóa tìm kiếm -> hiển thị Trang chủ > Tìm kiếm: <từ khóa> và dừng.
    if (searchText) {
      items.push({ title: pageTitle, url: null });
      return items;
    }

    if (pageTitle && !shouldUseCategoryPathBreadcrumb) {
      items.push({ title: pageTitle, url: null });
    }

    if (categoryTitle && categoryTitle !== "all") {
      items.push({
        title: categoryTitle,
        url: buildCategoryPageUrl(categoryTitle),
      });
    }

    if (subCategoryTitle && subCategoryTitle !== "all") {
      items.push({
        title: subCategoryTitle,
        url: buildSubCategoryPageUrl(categoryTitle, subCategoryTitle),
      });
    }

    return items;
  }, [config?.title, selectedCategory, selectedSubCategory, isCategoryType, searchText, isEventPage, eventDetail?.title]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    setProducts([]);
    setEventDetail(null);
    setEventInfoVisible(true);

    const apiUrl = isEventPage
      ? `${API_BASE}/api/user/events/${encodeURIComponent(String(eventId))}/products`
      : config.api;

    request("GET", apiUrl)
      .then((data) => {
        if (!mounted) return;
        if (isEventPage) {
          setEventDetail(data?.data?.event || null);
          setProducts(Array.isArray(data?.data?.products) ? data.data.products : []);
          return;
        }
        // Chuẩn hóa response: backend có thể trả trực tiếp [] hoặc { success, data: [] }.
        const nextProducts = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setProducts(nextProducts);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Không thể tải sản phẩm.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [type, eventId, isEventPage, config.api, request]);

  useEffect(() => {
    if (eventDetail) {
      setEventAccentColor(getRandomEventAccentColor());
    }
  }, [eventDetail]);

  // Lọc sản phẩm theo filter
  const filteredProducts = React.useMemo(() => {
    return products.filter((item) => {
      // Lọc theo search
      if (
        searchText &&
        !(item.ProductName || "")
          .toLowerCase()
          .includes(searchText.toLowerCase())
      )
        return false;
      // Lọc theo category
      if (selectedCategory !== "all" && item.CategoryName !== selectedCategory)
        return false;
      // Lọc theo subcategory
      if (
        selectedSubCategory !== "all" &&
        String(item.SubCategoryName || "") !== String(selectedSubCategory)
      )
        return false;
      // Lọc theo khoảng giá
      const price = item.sale_price || item.Price || 0;
      if (price < selectedPriceRange[0] || price > selectedPriceRange[1])
        return false;
      // Lọc sale only
      if (saleOnly && !item.sale_price) return false;
      return true;
    });
  }, [products, searchText, selectedCategory, selectedSubCategory, selectedPriceRange, saleOnly]);
  
  //Xử lý đường dẫn ảnh trước khi đưa vào <img>
  const resolveProductImage = (img) => {
    if (!img) return "";
    return `${UPLOAD_BASE}/pictures/${img}`;
  };

  const resolveEventBannerImage = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw) || raw.startsWith("data:image/")) return raw;
    if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
    if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
    return `${API_BASE}/uploads/assets/pictures/BannerImage/${raw}`;
  };

  const formatEventDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
  };

  // Sắp xếp
  const sortedProducts = React.useMemo(() => {
    let arr = [...filteredProducts];
    if (sortBy === "price-asc")
      arr.sort(
        (a, b) =>
          (a.sale_price || a.Price || 0) - (b.sale_price || b.Price || 0),
      );
    else if (sortBy === "price-desc")
      arr.sort(
        (a, b) =>
          (b.sale_price || b.Price || 0) - (a.sale_price || a.Price || 0),
      );
    return arr;
  }, [filteredProducts, sortBy]);

  const isBrandListing = String(type || "") === "featured-brands";

  // Sử lý ảnh trước khi đưa vào <img> của brand
  const resolveBrandLogo = (value) => {
    if (!value) return "";
    return `${UPLOAD_BASE}/pictures/Brands/${value}`;
  };

  const eventAccentRgb = React.useMemo(
    () => hexToRgb(eventAccentColor),
    [eventAccentColor],
  );

  return (
    <section className="all-products-page-2col container">
      {isEventPage && eventDetail ? (
        <div
          className="event-products-hero"
          style={{
            "--event-accent": eventAccentColor,
            "--event-accent-rgb": eventAccentRgb,
          }}
        >
          {eventDetail.banner_image ? (
            <div className="event-products-hero__banner-frame">
              <img
                className="event-products-hero__banner-bg"
                src={resolveEventBannerImage(eventDetail.banner_image)}
                alt=""
                aria-hidden="true"
              />
              <img
                className="event-products-hero__banner"
                src={resolveEventBannerImage(eventDetail.banner_image)}
                alt={eventDetail.title || "Banner sự kiện"}
              />
            </div>
          ) : null}
          <div className="event-products-hero__content">
            <div className="event-products-hero__head">
              <div className="event-products-hero__title-block">
                {eventDetail.code ? <span>{eventDetail.code}</span> : null}
                <h1>{eventDetail.title}</h1>
              </div>
              <button
                type="button"
                className="event-products-hero__toggle"
                onClick={() => setEventInfoVisible((prev) => !prev)}
                aria-expanded={eventInfoVisible}
              >
                {eventInfoVisible ? "Bớt thông tin" : "Đọc thêm"}
              </button>
            </div>
            {eventInfoVisible ? (
              <div className="event-products-hero__info">
                {eventDetail.description ? <p>{eventDetail.description}</p> : null}
                <div className="event-products-hero__meta">
                  {(eventDetail.start_date || eventDetail.end_date) ? (
                    <span>
                      {formatEventDate(eventDetail.start_date) || "--"} - {formatEventDate(eventDetail.end_date) || "--"}
                    </span>
                  ) : null}
                  <span>{products.length} sản phẩm</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <TitleBanner option={config.title} breadcrumbItems={bannerBreadcrumbItems} />
      )}
      <div className="all-products-layout">
        <BrandProductFilter
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchText={searchText}
          setSearchText={setSearchText}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          selectedPriceRange={selectedPriceRange}
          setSelectedPriceRange={setSelectedPriceRange}
          saleOnly={saleOnly}
          setSaleOnly={setSaleOnly}
          PRICE_MIN_LIMIT={PRICE_MIN_LIMIT}
          PRICE_MAX_LIMIT={PRICE_MAX_LIMIT}
          PRICE_STEP={PRICE_STEP}
          formatVndShort={formatVndShort}
          filterPanelVisible={filterPanelVisible}
          setFilterPanelVisible={setFilterPanelVisible}
          isClosing={isClosing}
          setIsClosing={setIsClosing}
          uploadBase={UPLOAD_BASE}
        />
        {/* Grid sản phẩm bên phải */}
        <main className="all-products-main">
          {loading ? (
            <div className="all-products-loading">Đang tải sản phẩm...</div>
          ) : error ? (
            <div className="all-products-error">{error}</div>
          ) : (
            <div className="all-products-grid">
              {sortedProducts.length === 0 ? (
                <div className="all-products-empty-state">
                  <NoProductLottie />
                </div>
              ) : (
                isBrandListing ? (
                  // Render brands grid
                  (sortedProducts || []).map((brand, index) => (
                    <div className="all-product-card" key={brand.idBrand || index}>
                      <a href={`/${ROUTERS.USER.BRAND_DETAIL.replace(":idBrand", String(brand.idBrand || "")).replace(/^\/+/, "")}`} className="brand-link" style={{ textDecoration: 'none' }}>
                        <img className="all-product-img" src={resolveBrandLogo(brand.logoUrl || brand.logo_url || brand.previewImage)} alt={brand.brandName || brand.Brand} />
                        <div className="all-product-name">{brand.brandName || brand.Brand}</div>
                      </a>
                    </div>
                  ))
                ) : (
                  sortedProducts.map((item, index) => (
                    <ProductCard
                      key={item.ProductID || item.idBrand}
                      item={item}
                      cardIndex={index}
                      detailUrl={`/product/${item.ProductID}`} // 👈 sửa theo route của bạn
                      resolveProductImage={resolveProductImage}
                      onAddToCart={(e, item) => {
                        console.log("Add to cart:", item);
                        // 👉 sau này gắn redux / context / api
                      }}
                    />
                  ))
                )
              )}
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
