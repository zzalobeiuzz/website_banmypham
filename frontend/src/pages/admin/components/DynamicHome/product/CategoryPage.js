import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./category.scss";

const CategoryPage = () => {
  const { request } = useHttp();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          request("GET", `${API_BASE}/api/user/products/loadCategory`),
          request("GET", `${API_BASE}/api/user/products/loadAllProducts`),
        ]);
        setCategories(catRes.data || []);
        setProducts(prodRes.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [request]);

  const countsByCategory = useMemo(() => {
    const map = {};
    for (const p of products) {
      const key = p.CategoryName || "(Không có)";
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [products]);

  return (
    <div className="category-page">
      <h2>Danh mục hàng hóa</h2>
      <div className="category-grid">
        {categories.map((c) => (
          <div key={c.CategoryID} className="category-card">
            <div className="category-name">{c.CategoryName}</div>
            <div className="category-count">{countsByCategory[c.CategoryName] || 0} sản phẩm</div>
            <div className="category-actions">
              <button
                onClick={() =>
                  navigate(`/admin?category=${encodeURIComponent(c.CategoryName)}`)
                }
              >
                Xem sản phẩm
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;
