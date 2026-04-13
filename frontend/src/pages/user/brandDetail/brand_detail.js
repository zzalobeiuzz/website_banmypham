import React, { memo, useEffect, useMemo, useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import { ROUTERS } from "../../../utils/router";
import "./brand_detail.scss";
import { flyToCart } from "../homePage/components/FlyToCart";
import ProductCard from "../homePage/components/ProductCard";

// Thêm hàm addToCart và hiệu ứng fly to cart
const getCartItemsFromStorage = () => {
  try {
    const raw = localStorage.getItem("cartItems");
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCartItemsToStorage = (items) => {
  localStorage.setItem("cartItems", JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
};

const handleAddToCart = (event, product) => {
  event.preventDefault();
  event.stopPropagation();
  const productCard = event.currentTarget.closest(".brand-product-card");
  const productImage = productCard?.querySelector("img");
  flyToCart(productImage);
  const productId = String(
    product?.ProductID || product?.ProductId || product?.id || "",
  ).trim();
  if (!productId) return;
  const cartItems = getCartItemsFromStorage();
  const foundIndex = cartItems.findIndex(
    (item) => String(item?.productId) === productId,
  );
  if (foundIndex >= 0) {
    const currentQty = Number(cartItems[foundIndex].quantity || 0);
    cartItems[foundIndex] = {
      ...cartItems[foundIndex],
      quantity: currentQty + 1,
    };
  } else {
    cartItems.push({ productId, quantity: 1 });
  }
  saveCartItemsToStorage(cartItems);
};

const PRICE_MIN_LIMIT = 0;
const PRICE_MAX_LIMIT = 10000000;
const PRICE_STEP = 100000;

const formatVndShort = (value) => {
  const numeric = Number(value || 0);
  if (numeric >= 1000000) {
    return `${(numeric / 1000000).toLocaleString("vi-VN")} triệu`;
  }
  return `${numeric.toLocaleString("vi-VN")}đ`;
};

const resolveBrandLogo = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
  return `${UPLOAD_BASE}/icons/${raw.replace(/^\/+/, "")}`;
};

const resolveProductImage = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return `${UPLOAD_BASE}/pictures/no_image.jpg`;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
  return `${UPLOAD_BASE}/pictures/${raw.replace(/^\/+/, "")}`;
};

const BrandDetailPage = () => {
  const { idBrand } = useParams();
  const navigate = useNavigate();
  const { request } = useHttp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState([
    PRICE_MIN_LIMIT,
    PRICE_MAX_LIMIT,
  ]);
  const [saleOnly, setSaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // Bổ sung lại categories và filteredProducts
  const categories = useMemo(() => {
    const values = new Set();
    products.forEach((item) => {
      const value = String(item?.CategoryName || "").trim();
      if (value) values.add(value);
    });
    return ["all", ...Array.from(values)];
  }, [products]);

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
              onClick={() => navigate(-1)}
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

          <div className="brand-detail-user-tools">
            {!showFilterPanel && (
              <button
                type="button"
                className="brand-filter-toggle-btn"
                onClick={() => setShowFilterPanel(true)}
                title="Mở bộ lọc"
              >
                <img src={`${UPLOAD_BASE}/icons/icons8-filter.gif`} alt="Mở bộ lọc" />
              </button>
            )}
          </div>

          <div
            className={`brand-detail-user-layout ${showFilterPanel ? "" : "brand-detail-user-layout--no-filter"}`}
          >
            {showFilterPanel && (
              <aside className="brand-filter-panel"> 
                <div className="brand-filter-panel__content">
                  <div className="brand-filter-panel__head">
                    <h3>Bộ lọc</h3>
                  </div>
                
                  <label>
                    Sắp xếp theo giá
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="default">Mặc định</option>
                      <option value="price-asc">Giá thấp đến cao</option>
                      <option value="price-desc">Giá cao đến thấp</option>
                    </select>
                  </label>
                  <label>
                    Tìm sản phẩm
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Nhập tên sản phẩm"
                    />
                  </label>

                  <label>
                    Danh mục
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category === "all" ? "Tất cả" : category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="brand-filter-price">
                    <label>Khoảng giá</label>
                    <div className="brand-filter-price-slider">
                      <div className="brand-filter-price-slider__values">
                        <span>{formatVndShort(selectedPriceRange[0])}</span>
                        <span>{formatVndShort(selectedPriceRange[1])}</span>
                      </div>
                      <Slider
                        range
                        min={PRICE_MIN_LIMIT}
                        max={PRICE_MAX_LIMIT}
                        step={PRICE_STEP}
                        value={selectedPriceRange}
                        onChange={setSelectedPriceRange}
                        allowCross={false}
                        pushable={PRICE_STEP}
                        marks={{
                          0: "0",
                          2000000: "2tr",
                          4000000: "4tr",
                          6000000: "6tr",
                          8000000: "8tr",
                          10000000: "10tr",
                        }}
                      />
                      {/* Đã xoá phần chữ Đang lọc */}
                    </div>
                  </div>

                  <label className="brand-filter-checkbox">
                    <input
                      type="checkbox"
                      checked={saleOnly}
                      onChange={(e) => setSaleOnly(e.target.checked)}
                    />
                    Chỉ hiển thị sản phẩm đang giảm giá
                  </label>
                </div>
                <button
                  type="button"
                  className="brand-filter-close-icon"
                  onClick={() => setShowFilterPanel(false)}
                  aria-label="Đóng bộ lọc"
                  title="Đóng bộ lọc"
                >
                  <img className="brand-filter-close-icon__arrow" src={`${UPLOAD_BASE}/icons/icons-arrow-down.png`} alt="Đóng bộ lọc" width="18" height="18" />
                </button>
              </aside>
            )}

            <main className="brand-product-center">
              <div className="brand-product-grid">
                {filteredProducts.map((item, index) => (
                  <ProductCard
                    key={item.ProductID}
                    item={item}
                    onAddToCart={handleAddToCart}
                    detailUrl={`/${ROUTERS.USER.PRODUCT_DETAIL.replace(":id", String(item.ProductID || ""))}`}
                    resolveProductImage={resolveProductImage}
                    cardIndex={index}
                  />
                ))}
              </div>
            </main>

            <aside className="brand-info-panel">
              {brand?.logo_url && (
                <img
                  className="brand-info-panel__logo"
                  src={resolveBrandLogo(brand.logo_url)}
                  alt={brand?.Brand || "brand"}
                  loading="lazy"
                />
              )}
              <h3>{brand?.Brand || "Thương hiệu"}</h3>
              {brand?.description ? (
                <div
                  className="brand-info-panel__desc"
                  dangerouslySetInnerHTML={{ __html: brand.description }}
                />
              ) : (
                <p>Chưa có mô tả thương hiệu.</p>
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
};

export default memo(BrandDetailPage);
