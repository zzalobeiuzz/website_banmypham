// 🧠 Import thư viện và các hook cần thiết
import lottie from "lottie-web"; // 🎞️ Thư viện Lottie
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"; // 🔄 Lấy param từ URL
import { API_BASE, UPLOAD_BASE } from "../../../../../constants"; // � Đường dẫn gốc
import useHttp from "../../../../../hooks/useHttp"; // 🛠️ Custom hook gọi API
import "./style.scss"; // 🎨 CSS cho component

// 📦 Component hiển thị chi tiết sản phẩm
const ProductDetail = () => {
  const { id } = useParams(); // 🔎 Lấy mã sản phẩm từ URL
  const { request } = useHttp(); // Hook gọi API
  const [product, setProduct] = useState(null); // 🧩 State chứa thông tin sản phẩm
  const [loading, setLoading] = useState(true); // ⏳ Loading animation
  const [showContent, setShowContent] = useState(false); // 📺 Hiển thị nội dung sau khi load xong
  const loadingRef = useRef(); // 📍 DOM ref cho Lottie animation

  // 🚀 Gọi API khi component mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        setProduct(res.data);

        // ⏱️ Giữ animation 1.5s sau khi có dữ liệu rồi mới hiển thị nội dung
        setTimeout(() => {
          setShowContent(true);
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error("❌ Lỗi khi tải chi tiết sản phẩm:", error);
      }
    };

    fetchProduct();
  }, [id, request]);

  // 🎞️ Khởi tạo animation trong khi loading
  useEffect(() => {
    if (loadingRef.current && loading) {
      const anim = lottie.loadAnimation({
        container: loadingRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/Trail loading.json", // 🔁 File animation trong /public
      });

      return () => anim.destroy(); // 💥 Cleanup animation khi loading kết thúc
    }
  }, [loading]);

  // 🖼️ Xử lý đường dẫn ảnh
  const imageUrl = product?.Image?.startsWith("http")
    ? product.Image
    : `${UPLOAD_BASE}/pictures/${product?.Image || "default.jpg"}`;

  return (
    <div className="product-detail__container">
      {/* Loading Animation */}
      {!showContent && (
        <div className="product-detail__loading">
          <div
            ref={loadingRef}
            style={{ width: 250, height: 250, margin: "0 auto" }}
          />
          <p style={{ textAlign: "center", marginTop: 12 }}>
            Đang tải thông tin sản phẩm...
          </p>
        </div>
      )}

      {/* Nội dung chính */}
      <div
        className={`product-detail__wrapper ${
          showContent ? "show" : "hide"
        }`}
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
