import React, { useState, useMemo } from "react";
import BrandProductFilter from "./ProductFilter";
import "rc-slider/assets/index.css";

export default function ProductFilterPanel({
  products,
  onFilter,
  initialVisible = true,
  initialSort = "default",
  initialCategory = "all",
  initialSaleOnly = false,
  initialSearch = "",
  initialPriceRange = [0, 10000000],
  priceMin = 0,
  priceMax = 10000000,
  priceStep = 100000,
  formatVndShort = v => (v >= 1000000 ? (v/1000000).toFixed(1) + "tr" : v.toLocaleString("vi-VN") + "đ"),
  uploadBase = "",
}) {
  const [sortBy, setSortBy] = useState(initialSort);
  const [searchText, setSearchText] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState(initialPriceRange);
  const [saleOnly, setSaleOnly] = useState(initialSaleOnly);
  const [filterPanelVisible, setFilterPanelVisible] = useState(initialVisible);
  const [isClosing, setIsClosing] = useState(false);

  const categories = useMemo(() => {
    const values = new Set(["all"]);
    products.forEach((item) => {
      if (item?.CategoryName) values.add(item.CategoryName);
    });
    return Array.from(values);
  }, [products]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    const query = String(searchText || "").trim().toLowerCase();
    const [minValue, maxValue] = selectedPriceRange;
    const filtered = products.filter((item) => {
      const name = String(item?.ProductName || "").toLowerCase();
      const category = String(item?.CategoryName || "").trim();
      const price = Number(item?.sale_price || item?.Price || 0);
      const hasSale = Number(item?.sale_price || 0) > 0;
      const matchName = !query || name.includes(query);
      const matchCategory = selectedCategory === "all" || category === selectedCategory;
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
  }, [products, searchText, selectedCategory, selectedPriceRange, saleOnly, sortBy]);

  React.useEffect(() => {
    if (onFilter) onFilter(filteredProducts);
    // eslint-disable-next-line
  }, [filteredProducts]);

  return (
    <>
      {filterPanelVisible || isClosing ? (
        <aside
          className={`brand-filter-panel ${isClosing ? "closing" : ""} ${!filterPanelVisible ? "hidden" : ""}`}
          onTransitionEnd={e => {
            if (!isClosing) return;
            if (e.target !== e.currentTarget) return;
            setFilterPanelVisible(false);
            setIsClosing(false);
          }}
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
            PRICE_MIN_LIMIT={priceMin}
            PRICE_MAX_LIMIT={priceMax}
            PRICE_STEP={priceStep}
            formatVndShort={formatVndShort}
          />
          <button
            type="button"
            className="brand-filter-close-icon"
            onClick={() => {
              if (!isClosing) {
                setIsClosing(true);
                setTimeout(() => {
                  setFilterPanelVisible(false);
                  setIsClosing(false);
                }, 350);
              }
            }}
            aria-label="Đóng bộ lọc"
            title="Đóng bộ lọc"
          >
            <img
              className="brand-filter-close-icon__arrow"
              src={`${uploadBase}/icons/icons-arrow-down.png`}
              alt="Đóng bộ lọc"
              width="18"
              height="18"
            />
          </button>
        </aside>
      ) : (
        <div className={`brand-filter-placeholder ${!filterPanelVisible && !isClosing ? "show" : ""}`}>
          <div className="brand-filter-overflow"></div>
          <button
            title="Mở bộ lọc"
            type="button"
            className="brand-filter-toggle-btn"
            onClick={() => {
              setFilterPanelVisible(true);
              setTimeout(() => {
                setIsClosing(false);
              }, 10);
            }}
          >
            <img
              src={`${uploadBase}/icons/icons-arrow-down.png`}
              alt="Mở bộ lọc"
            />
          </button>
        </div>
      )}
    </>
  );
}
