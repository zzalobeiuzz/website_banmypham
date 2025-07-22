import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./style.scss";

const ProductDetail = () => {
  const { id } = useParams(); // 🆔 Lấy ID sản phẩm từ URL
  const { request } = useHttp();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const animationRef = useRef(null);

  // 🟢 Lottie animation
  useEffect(() => {
    if (animationRef.current) {
      const instance = lottie.loadAnimation({
        container: animationRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/json/loading.json",
      });
      return () => instance.destroy();
    }
  }, []);

  // 🟢 Gọi API để lấy chi tiết sản phẩm
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await request.get(`${API_BASE}/products/detail/${id}`);
        setProduct(res.product);
      } catch (err) {
        console.error("Lỗi khi lấy sản phẩm:", err);
      } finally {
        setTimeout(() => setLoading(false), 600); // Delay ẩn animation để mượt hơn
      }
    };
    fetchData();
  }, [id, request]);

  return (
    <div className="product-detail__container">
      {loading && (
        <div className="product-detail__loading">
          <div ref={animationRef} className="product-detail__loading-animation"></div>
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      )}

      {/* 🟡 Khi đã có dữ liệu thì hiển thị */}
      {!loading && product && (
        <div className="product-detail__info fade-in">
          <h2>{product?.ProductName}</h2>

          <p>
            <strong>Giá:</strong>{" "}
            {product?.Price?.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            })}
          </p>

          <p>
            <strong>Tồn kho:</strong> {product?.StockQuantity}
          </p>

          <p>
            <strong>Danh mục:</strong> {product?.CategoryName}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
