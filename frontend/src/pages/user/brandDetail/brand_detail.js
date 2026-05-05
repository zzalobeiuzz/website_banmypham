import React, { memo, useEffect, useMemo, useState } from "react";
import lottie from "lottie-web";
import noProductAnimation from "../../../animation/no_product.json";
import BrandProductFilter from "../homePage/components/ProductFilter";
import "rc-slider/assets/index.css";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import { ROUTERS } from "../../../utils/router";
import "./brand_detail.scss";
import ProductCard from "../homePage/components/ProductCard";

const NoProductLottie = () => {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
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
        minHeight: "40vh",
        background: "transparent",
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
          maxWidth: 450,
          height: 450,
          background: "transparent",
          marginBottom: 16,
          borderRadius: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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

const ExpandBrandDesc = ({ brand, open, setOpen }) => {
  if (!brand?.description) {
    return <p>Chưa có mô tả thương hiệu.</p>;
  }

  return (
    <div className="brand-expand-desc-wrapper">
      <div
        className={`brand-info-panel__desc ${open ? "expanded" : "collapsed"}`}
        dangerouslySetInnerHTML={{ __html: brand.description }}
      />

      {!open && <div className="brand-expand-desc-fade" />}
    </div>
  );
};
const BrandDetailPage = () => {
  const [open, setOpen] = React.useState(false);
  // Lấy idBrand từ URL
  const { idBrand } = useParams();
  const navigate = useNavigate();
  const { request } = useHttp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [saleOnly, setSaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  // State điều khiển panel bộ lọc
  const [filterPanelVisible, setFilterPanelVisible] = useState(true); // true: panel đang hiển thị hoặc đang hiệu ứng đóng
  const [isClosing, setIsClosing] = useState(false); // true: đang chạy hiệu ứng đóng
  // Đã loại bỏ showPlaceholderDuringClose

  // Các hằng số và hàm hỗ trợ cho bộ lọc giá
  const PRICE_MIN_LIMIT = 0;
  const PRICE_MAX_LIMIT = 10000000;
  const PRICE_STEP = 100000;
  const [selectedPriceRange, setSelectedPriceRange] = useState([
    PRICE_MIN_LIMIT,
    PRICE_MAX_LIMIT,
  ]);

  // Hàm định dạng số thành chuỗi tiền tệ ngắn gọn
  const formatVndShort = (value) => {
    const numeric = Number(value || 0);
    if (numeric >= 1000000) {
      return `${(numeric / 1000000).toLocaleString("vi-VN")} triệu`;
    }
    return `${numeric.toLocaleString("vi-VN")}đ`;
  };

  // Hàm xử lý hiển thị logo thương hiệu
  const resolveBrandLogo = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
    if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
    return `${UPLOAD_BASE}/pictures/Brands/${raw.replace(/^\/+/, "")}`;
  };

  // Hàm xử lý hiển thị ảnh sản phẩm
  const resolveProductImage = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return `${UPLOAD_BASE}/pictures/no_image.jpg`;
    if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
    if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
    return `${UPLOAD_BASE}/pictures/${raw.replace(/^\/+/, "")}`;
  };

  // Bổ sung lại categories và filteredProducts
  const categories = useMemo(() => {
    const values = new Set();
    products.forEach((item) => {
      const value = String(item?.CategoryName || "").trim();
      if (value) values.add(value);
    });
    return ["all", ...Array.from(values)];
  }, [products]);

  // Hàm lọc và sắp xếp sản phẩm dựa trên các tiêu chí đã chọn
  const filteredProducts = useMemo(() => {
    const query = String(searchText || "")
      .trim()
      .toLowerCase();
    const [minValue, maxValue] = selectedPriceRange;

    const filtered = products.filter((item) => {
      const name = String(item?.ProductName || "").toLowerCase();
      const category = String(item?.CategoryName || "").trim();
      const price = Number(item?.sale_price || item?.Price || 0);
      const hasSale = Number(item?.sale_price || 0) > 0;

      const matchName = !query || name.includes(query);
      const matchCategory =
        selectedCategory === "all" || category === selectedCategory;
      const matchMin = price >= minValue;
      const matchMax = price <= maxValue;
      const matchSale = !saleOnly || hasSale;

      return matchName && matchCategory && matchMin && matchMax && matchSale;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "price-asc") {
        return (
          Number(a?.sale_price || a?.Price || 0) -
          Number(b?.sale_price || b?.Price || 0)
        );
      }
      if (sortBy === "price-desc") {
        return (
          Number(b?.sale_price || b?.Price || 0) -
          Number(a?.sale_price || a?.Price || 0)
        );
      }
      return Number(b?.ProductID || 0) - Number(a?.ProductID || 0);
    });
  }, [
    products,
    searchText,
    selectedCategory,
    selectedPriceRange,
    saleOnly,
    sortBy,
  ]);

  // Cuộn lên đầu trang khi idBrand thay đổi
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant", // hoặc "smooth"
    });
  }, [idBrand]);

  //
  useEffect(() => {
    let mounted = true;

    const fetchBrandDetail = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await request(
          "GET",
          `${API_BASE}/api/user/products/brand/${encodeURIComponent(String(idBrand || "").trim())}`,
        );
        if (!mounted) return;

        if (!res?.success || !res?.data) {
          setBrand(null);
          setProducts([]);
          setError(res?.message || "Không thể tải chi tiết thương hiệu.");
          return;
        }

        setBrand(res.data.brand || null);
        setProducts(Array.isArray(res.data.products) ? res.data.products : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Không thể tải chi tiết thương hiệu.");
        setBrand(null);
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBrandDetail();
    return () => {
      mounted = false;
    };
  }, [idBrand, request]);

  return (
    <section className="brand-detail-user-page container">
      {loading ? (
        <div className="brand-detail-user-state">Đang tải thương hiệu...</div>
      ) : error ? (
        <div className="brand-detail-user-state brand-detail-user-state--error">
          {error}
        </div>
      ) : (
        <>
          <div className="brand-detail-top-left">
            <button
              type="button"
              className="brand-detail-back-btn"
              onClick={() => navigate("/")}
            >
              Quay lại
            </button>
          </div>

          {brand && (
            <div className="brand-detail-header">
              <div className="brand-detail-header__background"></div>
              <div className="brand-detail-header__content">
                {brand?.logo_url && (
                  <img
                    className="brand-detail-header__logo"
                    src={resolveBrandLogo(brand.logo_url)}
                    alt={brand?.Brand || "brand"}
                    loading="lazy"
                  />
                )}
                <div className="brand-detail-header__text">
                  <h1>{brand?.Brand || "Thương hiệu"}</h1>
                  <p className="brand-detail-header__meta">
                    {filteredProducts.length} sản phẩm phù hợp
                  </p>
                </div>
              </div>
            </div>
          )}
          <div
            className={`brand-detail-user-layout
            ${!filterPanelVisible && !isClosing ? "brand-detail-user-layout--no-filter" : ""}
            ${open ? "brand-detail-user-layout--expand-infobrand" : ""}`}
          >
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
            />
            <main
              className={`brand-product-center${filteredProducts.length === 0 ? " no-products" : ""}`}
            >
              {filteredProducts.length === 0 ? (
                <NoProductLottie />
              ) : (
                <div className="brand-product-grid">
                  {filteredProducts.map((item, index) => (
                    <ProductCard
                      key={item.ProductID}
                      item={item}
                      // onAddToCart={handleAddToCart}
                      detailUrl={`/${ROUTERS.USER.PRODUCT_DETAIL.replace(":id", String(item.ProductID || ""))}`}
                      resolveProductImage={resolveProductImage}
                      cardIndex={index}
                    />
                  ))}
                </div>
              )}
            </main>
            <aside className={"brand-info-panel"}>
              {brand?.logo_url && (
                <>
                  <img
                    className="brand-info-panel__logo"
                    src={resolveBrandLogo(brand.logo_url)}
                    alt={brand?.Brand || "brand"}
                    loading="lazy"
                  />
                  <button
                    type="button"
                    aria-label={open ? "Thu gọn mô tả" : "Mở rộng mô tả"}
                    title={open ? "Thu gọn mô tả" : "Mở rộng mô tả"}
                    onClick={() => setOpen((prev) => !prev)}
                    className="brand-expand-toggle-btn"
                  >
                    <img
                      src={
                        open
                          ? `${UPLOAD_BASE}/icons/icons8-minimize.png`
                          : `${UPLOAD_BASE}/icons/icons8-full-screen.png`
                      }
                      alt={open ? "Thu gọn" : "Mở rộng"}
                      width={24}
                      height={24}
                      className="brand-expand-toggle-icon"
                      style={{
                        transform: open ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        filter: "drop-shadow(0 1px 2px #0002)",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </button>
                </>
              )}

              <ExpandBrandDesc brand={brand} open={open} setOpen={setOpen} />
            </aside>
          </div>
        </>
      )}
    </section>
  );
};

export default memo(BrandDetailPage);
