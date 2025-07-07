import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
  const { request } = useHttp();
  const [categories, setCategories] = useState([]);

  // Bộ lọc
  const [filterOpen, setFilterOpen] = useState(false);
  const [showFilterContent, setShowFilterContent] = useState(false);

  // Danh mục topbar
  const [showCategories, setShowCategories] = useState(true);
  const [containerVisible, setContainerVisible] = useState(true);

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

  const handleOpen = () => {
    setContainerVisible(true);
    setTimeout(() => {
      setShowCategories(true);
    }, 50);
  };

  const handleCloseCategories = () => {
    setShowCategories(false);
    const totalTime = categories.length * 100 + 400;
    setTimeout(() => {
      setContainerVisible(false);
    }, totalTime);
  };

  const handleToggleFilter = () => {
    if (!filterOpen) {
      setFilterOpen(true);
      setTimeout(() => setShowFilterContent(true), 500);
    } else {
      setShowFilterContent(false);
      setFilterOpen(false);
    }
  };

  const isActive = showCategories;

  return (
    <div className="product-wrapper">
      {/* Topbar */}
      <div className={`product-topbar ${isActive ? "show" : ""}`}>
        {!containerVisible && (
          <button className="toggle-button" onClick={handleOpen}>
            Mở danh mục ➜
          </button>
        )}

        {containerVisible && (
          <div className="category-buttons">
            {categories.map((category, index) => (
              <button
                key={category.CategoryID}
                style={{
                  transition: "all 0.4s ease",
                  transitionDelay: showCategories
                    ? `${index * 0.1}s`
                    : `${(categories.length - index) * 0.1}s`,
                  transform: showCategories ? "translateX(0)" : "translateX(-20px)",
                  opacity: showCategories ? 1 : 0,
                }}
              >
                {category.CategoryName}
              </button>
            ))}

            {showCategories && (
              <button
                className="close-button"
                onClick={handleCloseCategories}
                style={{
                  transition: "all 0.4s ease",
                  transitionDelay: `${categories.length * 0.1}s`,
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

      {/* Content */}
      <div className={`product-content ${filterOpen ? "open" : "closed"}`}>
        {/* Nút toggle filter nằm trên đầu */}
        <div
          className="filter-toggle-header"
          onClick={handleToggleFilter}
          style={{
            cursor: "pointer",
            marginBottom: "10px",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {!filterOpen ? (
            <>
              <img
                src="/assets/icons/icons8-filter.gif"
                alt="filter icon"
                style={{ width: "24px", height: "24px", verticalAlign: "middle" }}
              />
              <span>Mở bộ lọc</span>
            </>
          ) : (
            <>
              <span>✖</span><div className="filter-header">
                <p>Bộ lọc sản phẩm</p>
              </div>
            </>
          )}
        </div>

        <div className="product-left">
          {showFilterContent && (
            <>
              
              <div className="filter-body">
                <p>Đây là các tùy chọn lọc...</p>
              </div>
            </>
          )}
        </div>

        <div className="product-right">
          <div>Danh sách sản phẩm</div>
        </div>
      </div>
    </div>
  );
};
