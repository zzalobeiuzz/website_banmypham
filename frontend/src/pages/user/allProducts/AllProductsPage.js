import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";

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

  return (
    <section className="all-products-page container">
      <h1>{config.title}</h1>
      {loading ? (
        <div>Đang tải sản phẩm...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <div className="all-products-grid">
          {products.length === 0 ? (
            <div>Không có sản phẩm phù hợp.</div>
          ) : (
            products.map((item) => (
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
                  style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
                />
                <div style={{ fontWeight: 600, margin: "8px 0" }}>
                  {item.ProductName || item.brandName || "Sản phẩm"}
                </div>
                {item.sale_price && (
                  <div style={{ color: "#ef4444" }}>
                    {item.sale_price.toLocaleString("vi-VN")}đ
                  </div>
                )}
                {item.Price && (
                  <div style={{ color: "#64748b", textDecoration: item.sale_price ? "line-through" : "none" }}>
                    {item.Price.toLocaleString("vi-VN")}đ
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
