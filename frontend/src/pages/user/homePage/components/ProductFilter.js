import React from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { UPLOAD_BASE } from "../../../../constants";
import "./productFilter.scss";

export default function BrandProductFilter({
  sortBy,
  setSortBy,
  searchText,
  setSearchText,
  selectedCategory,
  setSelectedCategory,
  categories,
  selectedPriceRange,
  setSelectedPriceRange,
  saleOnly,
  setSaleOnly,
  PRICE_MIN_LIMIT,
  PRICE_MAX_LIMIT,
  PRICE_STEP,
  formatVndShort,
  filterPanelVisible,
  setFilterPanelVisible,
  isClosing,
  setIsClosing,
  uploadBase,
}) {
  return (
    (filterPanelVisible || isClosing) ? (
      <aside
        className={`brand-filter-panel ${isClosing ? "closing" : ""} ${!filterPanelVisible ? "hidden" : ""}`}
        onTransitionEnd={(e) => {
          if (!isClosing) return;
          if (e.target !== e.currentTarget) return;
          setFilterPanelVisible(false);
          setIsClosing(false);
        }}
      >
        <div className="brand-filter-panel__content">
          <div className="brand-filter-panel__head">
            <h3>Bộ lọc</h3>
          </div>
          <label>
            Sắp xếp theo giá
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
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
              onChange={e => setSearchText(e.target.value)}
              placeholder="Nhập tên sản phẩm"
            />
          </label>
          <label>
            Danh mục
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              {categories.map(category => (
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
            </div>
          </div>
          <label className="brand-filter-checkbox">
            <input
              type="checkbox"
              checked={saleOnly}
              onChange={e => setSaleOnly(e.target.checked)}
            />
            <span className="checkbox-text">Chỉ hiển thị sản phẩm đang giảm giá</span>
          </label>
          
        </div>
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
              src={`${UPLOAD_BASE}/icons/icons-arrow-down.png`}
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
            src={`${UPLOAD_BASE}/icons/icons-arrow-down.png`}
            alt="Mở bộ lọc"
          />
        </button>
      </div>
    )
  );
}
