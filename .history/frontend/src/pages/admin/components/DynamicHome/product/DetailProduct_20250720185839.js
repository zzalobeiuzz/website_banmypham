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

  // 👉 Fetch chi tiết sản phẩm
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        console.log("✅ Dữ liệu API trả về:", res.data);
        setProduct(res.data);
      } catch (error) {
        console.error("❌ Lỗi khi tải chi tiết sản phẩm:", error);
        setLoading(false); // Cũng set false khi lỗi để tránh loading treo
      }
    };

    fetchProduct();
  }, [id, request]);

  // 👉 Load animation lottie và cleanup đúng cách
  useEffect(() => {
    let anim;
    if (loadingRef.current && loading) {
      anim = lottie.loadAnimation({
        container: loadingRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/Trail loading.json",
      });
    }
    return () => {
      if (anim) anim.destroy();
    };
  }, [loading]);

  // 👉 Xử lý đường dẫn ảnh an toàn
  const imageUrl = React.useMemo(() => {
    if (!product || !product.Image) return "/images/placeholder.png";
    if (typeof product.Image === "string" && product.Image.startsWith("http")) {
      return product.Image;
    }
    return `${UPLOAD_BASE}/pictures/${product.Image}`;
  }, [product]);

  return (
    <div className="product-detail__container">
      {loading ? (
        <div className="product-detail__loading">
          <div className="product-detail__loading-animation" ref={loadingRef} />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      ) : (
        <div className="product-detail__wrapper" style={{ minHeight: 300, border: '1px solid red' }}>
          <div
            className="product-detail__image"
            style={{ width: 300, minHeight: 200, border: "1px solid blue" }}
          >
            <img
              src={imageUrl}
              alt={product?.ProductName || "Không có tên"}
              style={{ width: "100%", height: "auto", display: "block" }}
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
              <strong>Danh mục:</strong> {product?.CategoryName || "Không xác định"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
