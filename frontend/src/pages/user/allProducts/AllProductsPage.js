
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import "./AllProductsPage.scss";
import BrandProductFilter from "../../../components/ProductFilter";
import TitleBanner from "../../../components/TitleBanner";

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
    api: `${API_BASE}/api/user/products/featured-brands`,
  },
};

export default function AllProductsPage() {
  const { type } = useParams();
  const { request } = useHttp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [sortBy, setSortBy] = useState("default");
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState([0, 10000000]);
  const [saleOnly, setSaleOnly] = useState(false);
  // Đóng/mở panel bộ lọc
  const [filterPanelVisible, setFilterPanelVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Lấy danh sách category từ products
  const categories = React.useMemo(() => {
    const cats = new Set(["all"]);
    products.forEach(p => {
      if (p.CategoryName) cats.add(p.CategoryName);
    });
    return Array.from(cats);
  }, [products]);

  const PRICE_MIN_LIMIT = 0;
  const PRICE_MAX_LIMIT = 10000000;
  const PRICE_STEP = 100000;
  const formatVndShort = (v) => (v >= 1000000 ? (v/1000000).toFixed(1) + "tr" : v.toLocaleString("vi-VN") + "đ");

  const config = TITLE_MAP[type] || TITLE_MAP["flash-sale"];

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    setProducts([]);
    request("GET", config.api)
      .then((data) => {
        if (!mounted) return;
        setProducts(data);
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
  }, [type, config.api, request]);

  // Lọc sản phẩm theo filter
  const filteredProducts = React.useMemo(() => {
    return products.filter(item => {
      // Lọc theo search
      if (searchText && !(item.ProductName || "").toLowerCase().includes(searchText.toLowerCase())) return false;
      // Lọc theo category
      if (selectedCategory !== "all" && item.CategoryName !== selectedCategory) return false;
      // Lọc theo khoảng giá
      const price = item.sale_price || item.Price || 0;
      if (price < selectedPriceRange[0] || price > selectedPriceRange[1]) return false;
      // Lọc sale only
      if (saleOnly && !item.sale_price) return false;
      return true;
    });
  }, [products, searchText, selectedCategory, selectedPriceRange, saleOnly]);

  // Sắp xếp
  const sortedProducts = React.useMemo(() => {
    let arr = [...filteredProducts];
    if (sortBy === "price-asc") arr.sort((a, b) => (a.sale_price || a.Price || 0) - (b.sale_price || b.Price || 0));
    else if (sortBy === "price-desc") arr.sort((a, b) => (b.sale_price || b.Price || 0) - (a.sale_price || a.Price || 0));
    return arr;
  }, [filteredProducts, sortBy]);

  return (
    <section className="all-products-page-2col container">
      <TitleBanner option={config.title} />
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
                <div className="all-products-empty">Không có sản phẩm phù hợp.</div>
              ) : (
                sortedProducts.map((item) => (
                  <div key={item.ProductID || item.idBrand} className="all-product-card">
                    <img
                      src={
                        item.Image
                          ? `${UPLOAD_BASE}/pictures/${item.Image}`
                          : item.previewImage
                          ? `${UPLOAD_BASE}/pictures/${item.previewImage}`
                          : item.logoUrl
                          ? `${UPLOAD_BASE}/icons/${item.logoUrl}`
                          : ""
                      }
                      alt={item.ProductName || item.brandName || "Sản phẩm"}
                      className="all-product-img"
                    />
                    <div className="all-product-name">
                      {item.ProductName || item.brandName || "Sản phẩm"}
                    </div>
                    {item.sale_price && (
                      <div className="all-product-sale-price">
                        {item.sale_price.toLocaleString("vi-VN")}đ
                      </div>
                    )}
                    {item.Price && (
                      <div className={item.sale_price ? "all-product-origin-price strikethrough" : "all-product-origin-price"}>
                        {item.Price.toLocaleString("vi-VN")}đ
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
