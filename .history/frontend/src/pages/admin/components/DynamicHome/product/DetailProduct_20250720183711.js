import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./style.scss";

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        setProduct(res.data);
setLoading(false);
        // Delay thêm 1.5s để chạy animation
        // setTimeout(() => {
        //   
        // }, 1500);
      } catch (error) {
        console.error("❌ Lỗi khi tải chi tiết sản phẩm:", error);
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

  const imageUrl = product?.Image?.startsWith("http")
    ? product.Image
    : `${UPLOAD_BASE}/pictures/${product?.Image || "default.jpg"}`;

  return (
    <div className="product-detail__container">
      {loading ? (
        <div className="product-detail__loading">
          <div className="product-detail__loading-animation" ref={loadingRef} />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      ) : (
        <div className="product-detail__wrapper">
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
      )}
    </div>
  );
};

export default ProductDetail;
