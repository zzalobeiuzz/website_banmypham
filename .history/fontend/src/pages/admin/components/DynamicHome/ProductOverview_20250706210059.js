import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
  const { request } = useHttp();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");

  // Load danh mục sản phẩm
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/user/products/loadCategory`);
        setCategories(res.data);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      }
    };

    fetchCategories();
  }, [request]);

  // Handler khi click
  const handleCategoryClick = (categoryID) => {
    setActiveCategory(categoryID);
    // Có thể gọi API lọc sản phẩm ở đây
    console.log("Đang chọn:", categoryID);
  };

  return (
    <div className="product-wrapper">
      {/* Topbar nằm trong wrapper */}
      <div className="product-topbar">
        <button
          className={activeCategory === "all" ? "active" : ""}
          onClick={() => handleCategoryClick("all")}
        >
          Tất cả
        </button>

        {categories.map((category) => (
          <button
            key={category.CategoryID}
            className={activeCategory === category.CategoryID ? "active" : ""}
            onClick={() => handleCategoryClick(category.CategoryID)}
          >
            {category.CategoryName}
          </button>
        ))}
      </div>

      <div className="product-content">
        <div className="product-left">
          <p>Bộ lọc sản phẩm</p>
        </div>
        <div className="product-right">
          <div>Danh sách sản phẩm</div>
        </div>
      </div>
    </div>
  );
};
