import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
  const { request } = useHttp();
  const [categories, setCategories] = useState([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [showFilterContent, setShowFilterContent] = useState(false);

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

  const handleToggleFilter = () => {
    if (!filterOpen) {
      setFilterOpen(true);
      setTimeout(() => setShowFilterContent(true), 300);
    } else {
      setShowFilterContent(false);
      setFilterOpen(false);
    }
  };

  return (
    <div className="product-wrapper">
      <div className="product-topbar">
        <div className="category-buttons">
          {categories.map((category) => (
            <button key={category.CategoryID}>{category.CategoryName}</button>
          ))}
        </div>
      </div>

      <div className={`product-content ${filterOpen ? "open" : ""}`}>
        <div className="product-left">
          <div className="filter-toggle-header" onClick={handleToggleFilter}>
            {!filterOpen ? (
              <>
                <img
                  src="/assets/icons/icons8-filter.gif"
                  alt="filter icon"
                  style={{ width: "24px", height: "24px" }}
                />
                <span>Mở bộ lọc</span>
              </>
            ) : (
              <>
                <span>✖ Bộ lọc sản phẩm</span>
              </>
            )}
          </div>

          {showFilterContent && (
            <div className="filter-body">
              <p>Đây là các tùy chọn lọc...</p>
              <p>Đây là các tùy chọn lọc...</p>
              <p>Đây là các tùy chọn lọc...</p>
              <p>Đây là các tùy chọn lọc...</p>
              <p>Đây là các tùy chọn lọc...</p>
              <p>Đây là các tùy chọn lọc...</p>
            </div>
          )}
        </div>

        <div className="product-right">
          <div className="fw-bold">Danh sách sản phẩm</div>
          <div className="container">
          <div className="field-table">
          <ul>
          <li>STT</li>
          
          </ul>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
