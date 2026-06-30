import React, { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";
import { useParams, useSearchParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import "./AllProductsPage.scss";
import BrandProductFilter from "../homePage/components/ProductFilter";
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
  "new-arrivals": {
    title: "Hàng mới về",
    api: `${API_BASE}/api/user/products/new-arrivals`,
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

const PRODUCTS_PER_PAGE = 12;
const BRAND_GROUP_KEYS = ["0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

const getRandomEventAccentColor = () => {
  const randomIndex = Math.floor(Math.random() * EVENT_ACCENT_COLORS.length);
  return EVENT_ACCENT_COLORS[randomIndex];
};

const hexToRgb = (hex) => {
  const normalized = String(hex || "").replace("#", "");
  const value = parseInt(normalized, 16);

  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
};

const getStockQuantity = (item) => {
  const stock = Number(item?.StockQuantity ?? item?.stockQuantity ?? 0);
  return Number.isFinite(stock) ? stock : 0;
};

const compareStockFirst = (a, b) => {
  const aInStock = getStockQuantity(a) > 0;
  const bInStock = getStockQuantity(b) > 0;

  if (aInStock === bInStock) return 0;
  return aInStock ? -1 : 1;
};

const getBrandName = (brand) =>
  String(brand?.brandName || brand?.Brand || brand?.name || brand?.idBrand || "").trim();

const getBrandGroupKey = (brand) => {
  const firstChar = getBrandName(brand).charAt(0).toUpperCase();
  if (/^[0-9]$/.test(firstChar)) return "0-9";
  if (/^[A-Z]$/.test(firstChar)) return firstChar;
  return "0-9";
};

export default function AllProductsPage() {
  const { type, eventId } = useParams();
  const [searchParams] = useSearchParams();
  const { request } = useHttp();
  const productMainRef = useRef(null);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState("1");
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
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

  // Nếu là category động: dùng API loadAllProducts rồi filter phía client theo selectedCategory.
  const config =
    TITLE_MAP[type] ||
    (isCategoryType
      ? {
          title: decodedType,
          api: `${API_BASE}/api/user/products/loadAllProducts`,
        }
      : TITLE_MAP["flash-sale"]);

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
          compareStockFirst(a, b) ||
          (a.sale_price || a.Price || 0) - (b.sale_price || b.Price || 0),
      );
    else if (sortBy === "price-desc")
      arr.sort(
        (a, b) =>
          compareStockFirst(a, b) ||
          (b.sale_price || b.Price || 0) - (a.sale_price || a.Price || 0),
      );
    else arr.sort(compareStockFirst);
    return arr;
  }, [filteredProducts, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [type, eventId, sortBy, searchText, selectedCategory, selectedSubCategory, selectedPriceRange, saleOnly]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedProducts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return sortedProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [currentPage, sortedProducts]);

  const pageOptions = React.useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  );

  const scrollToProductTop = () => {
    window.requestAnimationFrame(() => {
      const targetTop = productMainRef.current
        ? productMainRef.current.getBoundingClientRect().top + window.scrollY - 88
        : 0;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    });
  };

  const goToPage = (page) => {
    const nextPage = Math.min(totalPages, Math.max(1, page));
    setCurrentPage(nextPage);
    setPageInputValue(String(nextPage));
    setPageDropdownOpen(false);
    scrollToProductTop();
  };

  useEffect(() => {
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  const commitPageInput = () => {
    const nextPage = Number(pageInputValue);

    if (!Number.isFinite(nextPage) || !pageInputValue) {
      setPageInputValue(String(currentPage));
      return;
    }

    goToPage(Math.trunc(nextPage));
  };

  const handlePageInputChange = (event) => {
    setPageInputValue(event.target.value.replace(/\D/g, ""));
  };

  const handlePageInputKeyDown = (event) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
      commitPageInput();
    }
  };

  const isBrandListing = String(type || "") === "featured-brands";

  const brandGroups = React.useMemo(() => {
    if (!isBrandListing) return [];

    const groups = BRAND_GROUP_KEYS.map((key) => ({
      key,
      id: `brand-group-${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      brands: [],
    }));
    const groupByKey = new Map(groups.map((group) => [group.key, group]));

    [...sortedProducts]
      .sort((a, b) => getBrandName(a).localeCompare(getBrandName(b), "vi", { numeric: true }))
      .forEach((brand) => {
        const key = getBrandGroupKey(brand);
        const group = groupByKey.get(key) || groupByKey.get("0-9");
        group.brands.push(brand);
      });

    return groups.filter((group) => group.brands.length > 0);
  }, [isBrandListing, sortedProducts]);

  // Sử lý ảnh trước khi đưa vào <img> của brand
  const resolveBrandLogo = (value) => {
    if (!value) return "";
    return `${UPLOAD_BASE}/pictures/Brands/${value}`;
  };

  const scrollToBrandPageTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      ) : null}
      <div className={`all-products-layout${isBrandListing ? " all-products-layout--brands" : ""}`}>
        {!isBrandListing ? (
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
        ) : null}
        {/* Grid sản phẩm bên phải */}
        <main className="all-products-main" ref={productMainRef}>
          {loading ? (
            <div className="all-products-loading">Đang tải sản phẩm...</div>
          ) : error ? (
            <div className="all-products-error">{error}</div>
          ) : isBrandListing ? (
            <div className="brand-directory">
              {brandGroups.length === 0 ? (
                <div className="all-products-empty-state">
                  <NoProductLottie />
                </div>
              ) : (
                <>
                  <nav className="brand-directory__alphabet" aria-label="Lọc nhanh thương hiệu theo chữ cái">
                    {BRAND_GROUP_KEYS.map((key) => {
                      const group = brandGroups.find((item) => item.key === key);
                      return group ? (
                        <a key={key} href={`#${group.id}`}>
                          {key}
                        </a>
                      ) : (
                        <span key={key}>{key}</span>
                      );
                    })}
                  </nav>
                  <div className="brand-directory__groups">
                    {brandGroups.map((group) => (
                      <section className="brand-directory__group" id={group.id} key={group.key}>
                        <h2>{group.key}</h2>
                        <div className="brand-directory__grid">
                          {group.brands.map((brand, index) => {
                            const brandName = getBrandName(brand);
                            return (
                              <a
                                href={`/${ROUTERS.USER.BRAND_DETAIL.replace(":idBrand", String(brand.idBrand || "")).replace(/^\/+/, "")}`}
                                className="brand-directory__item"
                                key={brand.idBrand || brandName || index}
                              >
                                <span className="brand-directory__logo-frame">
                                  {brand.logoUrl || brand.logo_url || brand.previewImage ? (
                                    <img
                                      src={resolveBrandLogo(brand.logoUrl || brand.logo_url || brand.previewImage)}
                                      alt={brandName || "Thương hiệu"}
                                    />
                                  ) : (
                                    <span className="brand-directory__logo-placeholder">
                                      {(brandName || "?").charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </span>
                                <span className="brand-directory__name">{brandName}</span>
                              </a>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="brand-directory__back-top"
                    onClick={scrollToBrandPageTop}
                    aria-label="Đưa lên đầu trang"
                  >
                    ↑
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {sortedProducts.length > 0 ? (
                <div className="all-products-page-status">
                  Trang <strong>{currentPage}</strong>/{totalPages}
                </div>
              ) : null}
            <div className="all-products-grid">
              {sortedProducts.length === 0 ? (
                <div className="all-products-empty-state">
                  <NoProductLottie />
                </div>
              ) : (
                isBrandListing ? (
                  // Render brands grid
                  (paginatedProducts || []).map((brand, index) => (
                    <div className="all-product-card" key={brand.idBrand || index}>
                      <a href={`/${ROUTERS.USER.BRAND_DETAIL.replace(":idBrand", String(brand.idBrand || "")).replace(/^\/+/, "")}`} className="brand-link" style={{ textDecoration: 'none' }}>
                        <img className="all-product-img" src={resolveBrandLogo(brand.logoUrl || brand.logo_url || brand.previewImage)} alt={brand.brandName || brand.Brand} />
                        <div className="all-product-name">{brand.brandName || brand.Brand}</div>
                      </a>
                    </div>
                  ))
                ) : (
                  paginatedProducts.map((item, index) => (
                    <ProductCard
                      key={item.ProductID || item.idBrand}
                      item={item}
                      cardIndex={(currentPage - 1) * PRODUCTS_PER_PAGE + index}
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
            </>
          )}
          {!isBrandListing && !loading && !error && sortedProducts.length > PRODUCTS_PER_PAGE ? (
            <nav className="all-products-pagination" aria-label="Phân trang sản phẩm">
              <button
                type="button"
                className="all-products-pagination__icon-button all-products-pagination__icon-button--edge"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                aria-label="Trang đầu"
              >
                «
              </button>
              <button
                type="button"
                className="all-products-pagination__icon-button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Trang trước"
              >
                ‹
              </button>
              <div className={`all-products-pagination__selector${pageDropdownOpen ? " is-open" : ""}`}>
                <span>Trang</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pageInputValue}
                  onChange={handlePageInputChange}
                  onBlur={commitPageInput}
                  onKeyDown={handlePageInputKeyDown}
                  aria-label="Nhập số trang sản phẩm"
                />
                <button
                  type="button"
                  className="all-products-pagination__dropdown-button"
                  onClick={() => setPageDropdownOpen((open) => !open)}
                  aria-label="Chọn trang"
                  aria-expanded={pageDropdownOpen}
                >
                  ▾
                </button>
                {pageDropdownOpen ? (
                  <div className="all-products-pagination__menu" role="listbox" aria-label="Chọn trang sản phẩm">
                    {pageOptions.map((page) => (
                      <button
                        type="button"
                        key={page}
                        className={`all-products-pagination__menu-item${page === currentPage ? " is-active" : ""}`}
                        onClick={() => goToPage(page)}
                        role="option"
                        aria-selected={page === currentPage}
                      >
                        Trang {page}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="all-products-pagination__icon-button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Trang sau"
              >
                ›
              </button>
              <button
                type="button"
                className="all-products-pagination__icon-button all-products-pagination__icon-button--edge"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Trang cuối"
              >
                »
              </button>
            </nav>
          ) : null}
        </main>
      </div>
    </section>
  );
}
