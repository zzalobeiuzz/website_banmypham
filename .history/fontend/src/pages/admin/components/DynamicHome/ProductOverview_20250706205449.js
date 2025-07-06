import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
  const { request } = useHttp();
  const [categories, setCategories] = useState([]);

  // Load danh mục sản phẩm
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/user/products/loadCategory`);
        setCategories(res.data);
        con
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      }
    };

    fetchCategories();
  }, [request]);

  return (
    <>
      <div className="product-wrapper">
        {/* Topbar nằm trong wrapper */}
        <div className="product-topbar">
          {categories.map((category, idx) => (
            <button key={idx}>{category.name}</button>
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
    </>
  );
};
