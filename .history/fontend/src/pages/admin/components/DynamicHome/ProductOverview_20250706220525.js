import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
  const { request } = useHttp();
  const [categories, setCategories] = useState([]);
  const [filterOpen, setFilterOpen] = useState(true);
  const [showCategories, setShowCategories] = useState(false);

  // Khi đóng, ta vẫn giữ category-buttons trong DOM để chạy animation
  const [categoriesVisible, setCategoriesVisible] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/user/products/loadCategory`);
        setCategories(res.data);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error.status, error.message);
      }
    };

    fetchCategories();
  }, [request]);

  // Điều khiển hiện/ẩn animation
  useEffect(() => {
    if (showCategories) {
      setCategoriesVisible(true);
    } else {
      // Đợi animation chạy xong (tổng delay của các nút), rồi mới ẩn hoàn toàn
      const totalDelay = categories.length * 100 + 400;
      const timer = setTimeout(() => {
        setCategoriesVisible(false);
      }, totalDelay);
      return () => clearTimeout(timer);
    }
  }, [showCategories, categories.length]);

  return (
    <div className="product-wrapper">
      {/* ---------- Topbar chứa danh mục ---------- */}
      <div className={`product-topbar ${showCategories ? "show" : ""}`}>
        {/* Nút mở danh mục */}
        {!showCategories && (
          <button
            className="toggle-button"
            onClick={() => setShowCategories(true)}
          >
            Mở danh mục ➜
          </button>
        )}

        {/* Các nút danh mục sản phẩm */}
        {categoriesVisible && (
          <div className="category-buttons">
            {categories.map((category, index) => (
              <button
                key={category.CategoryID}
                style={{
                  transition: "all 0.4s ease",
                  transitionDelay: showCategories ? `${index * 0.1}s` : `${(categories.length - index) * 0.1}s`,
                  transform: showCategories ? "translateX(0)" : "translateX(-20px)",
                  opacity: showCategories ? 1 : 0,
                }}
              >
                {category.CategoryName}
              </button>
            ))}

            {/* Nút đóng */}
            {showCategories && (
              <button
                className="close-button"
                onClick={() => setShowCategories(false)}
                style={{
                  transition: "all 0.4s ease",
                  transitionDelay: showCategories ? `${categories.length * 0.1}s` : "0s",
                  transform: showCategories ? "translateX(0)" : "translateX(-20px)",
                  opacity: showCategories ? 1 : 0,
                }}
              >
                ✖ Đóng
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---------- Nội dung chính ---------- */}
      <div className="product-content">
        {/* Bộ lọc bên trái */}
        <div className={`product-left ${filterOpen ? "open" : "closed"}`}>
          <div
            className="filter-header"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <p>Bộ lọc sản phẩm</p>
            <span className="toggle-icon">{filterOpen ? "▲" : "▼"}</span>
          </div>

          {filterOpen && (
            <div className="filter-body">
              <p>Đây là các tùy chọn lọc...</p>
            </div>
          )}
        </div>

        {/* Danh sách sản phẩm bên phải */}
        <div className="product-right">
          <div>Danh sách sản phẩm</div>
        </div>
      </div>
    </div>
  );
};
