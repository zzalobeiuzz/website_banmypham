// 🧠 Import thư viện và hook cần thiết
import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./style.scss";

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();
  const loadingRef = useRef();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        setProduct(res.data);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error("❌ Không lấy được chi tiết sản phẩm:", err);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, request]);

  useEffect(() => {
    if (loadingRef.current && loading) {
      const anim = lottie.loadAnimation({
        container: loadingRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/Trail loading.json",
      });

      return () => anim.destroy();
    }
  }, [loading]);

  const imageUrl =
    typeof product?.Image === "string" && product.Image.startsWith("http")
      ? product.Image
      : `${UPLOAD_BASE}/pictures/${product?.Image || "default.jpg"}`;

  return (
    <div className="product-detail__container">
      {/* ⏳ Hiển thị loading animation */}
      {loading && (
        <div className="product-detail__loading">
          <div ref={loadingRef} className="product-detail__lottie" />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      )}

      {/* ✅ Khi không còn loading và có dữ liệu sản phẩm */}
      {!loading && product && (
        <div className="product-detail__wrapper show">
          {/* Hình ảnh sản phẩm */}
          <div className="product-detail__image">
            <img
              src={imageUrl}
              alt={product?.ProductName || "Không có tên"}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/images/placeholder.png";
              }}
            />
          </div>

          {/* Thông tin sản phẩm */}
          <div className="product-detail__info">
            <h2>{product.ProductName}</h2>
            <p>
              <strong>Giá:</strong>{" "}
              {product?.Price?.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </p>
            <p>
              <strong>Tồn kho:</strong> {product.StockQuantity}
            </p>
            <p>
              <strong>Danh mục:</strong> {product.CategoryName || "Chưa có"}
            </p>

            {/* 🎯 Nút thao tác */}
            <div className="product-detail__actions">
              <button className="btn btn-edit">✏️ Sửa</button>
              <button className="btn btn-delete">🗑️ Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
