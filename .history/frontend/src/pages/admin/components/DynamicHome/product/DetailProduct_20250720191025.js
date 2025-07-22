// 🧠 Import thư viện và hook cần thiết
import lottie from "lottie-web"; // 🎞️ Animation
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./style.scss"; // 🎨 Tách toàn bộ CSS

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();
  const loadingRef = useRef();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // Gọi API khi mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        setProduct(res.data);

        // Đợi 1.5s mới hiện content
        setTimeout(() => {
          setShowContent(true);
          setLoading(false);
        }, 1500);
      } catch (err) {
        console.error("❌ Không lấy được chi tiết sản phẩm:", err);
      }
    };

    fetchProduct();
  }, [id, request]);

  // Hiệu ứng loading
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

  // Tạo URL ảnh
  const imageUrl = product?.Image?.startsWith("http")
    ? product.Image
    : `${UPLOAD_BASE}/pictures/${product?.Image || "default.jpg"}`;

  return (
    <div className="product-detail__container">
      {!showContent && (
        <div className="product-detail__loading">
          <div ref={loadingRef} className="product-detail__lottie" />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      )}

      <div
        className={`product-detail__wrapper ${showContent ? "show" : ""}`}
      >
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

        <div className="product-detail__info">
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
      </div>
    </div>
  );
};

export default ProductDetail;
