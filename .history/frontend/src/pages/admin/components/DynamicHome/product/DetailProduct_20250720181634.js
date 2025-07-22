// 🧠 Import thư viện React và các hook cần thiết
import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"; // 🔄 Lấy param từ URL
import { API_BASE, UPLOAD_BASE } from "../../../../../constants"; // 🌐 URL gốc từ server
import useHttp from "../../../../../hooks/useHttp"; // 🛠️ Custom hook gọi API
import "./style.scss"; // 🎨 CSS cho component

// 📦 Component hiển thị chi tiết sản phẩm
const ProductDetail = () => {
  const { id } = useParams(); // 🔎 Lấy mã sản phẩm từ URL
  const { request } = useHttp(); // Hook gọi API
  const [product, setProduct] = useState(null); // 🧩 State chứa thông tin sản phẩm
  const [showContent, setShowContent] = useState(false); // ⏳ Trì hoãn hiển thị nội dung 1s
  const loadingRef = useRef(); // 📍 DOM ref cho Lottie animation

  // 🎞️ Load animation loading khi chưa có dữ liệu
  useEffect(() => {
  if (!showContent && loadingRef.current) {
    const anim = lottie.loadAnimation({
      container: loadingRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/animations/Trail loading.json", // 🔁 File animation trong /public
    });

    return () => anim.destroy(); // 💥 Xoá animation khi component unmount
  }
}, [showContent]); // 👈 chỉ phụ thuộc showContent


  // 🚀 Gọi API lấy chi tiết sản phẩm theo mã
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        setProduct(res.data); // ⬅️ Set dữ liệu

        // ⏳ Sau khi có dữ liệu, chờ 1s rồi mới hiển thị nội dung
        setTimeout(() => setShowContent(true), 1500);
      } catch (error) {
        console.error("❌ Lỗi khi tải chi tiết sản phẩm:", error);
      }
    };

    fetchProduct();
  }, [id, request]);

  // 🔄 Nếu chưa có dữ liệu hoặc chưa hết 1s → hiển thị animation loading
  if (!product || !showContent) {
    return (
      <div className="product-detail__loading">
        <div
          ref={loadingRef}
          style={{ width: 250, height: 250, margin: "0 auto" }}
        />
        <p style={{ textAlign: "center", marginTop: 12 }}>
          Đang tải thông tin sản phẩm...
        </p>
      </div>
    );
  }

  // 📷 Xử lý đường dẫn ảnh sản phẩm (dùng trực tiếp nếu là URL đầy đủ)
  const imageUrl = product.Image?.startsWith("http")
    ? product.Image
    : `${UPLOAD_BASE}/pictures/${product.Image || "default.jpg"}`;

  // ✅ Nếu đã có dữ liệu & chờ đủ 1s → render chi tiết sản phẩm
  return (
    <div className="product-detail__wrapper">
      <div className="product-detail__image">
        <img
          src={imageUrl}
          alt={product.ProductName || "Không có tên"}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/images/placeholder.png"; // 🧱 fallback nếu ảnh lỗi
          }}
        />
      </div>

      <div className="product-detail__info">
        <h2>{product.ProductName}</h2>
        <p>
          <strong>Giá:</strong>{" "}
          {product.Price.toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
          })}
        </p>
        <p>
          <strong>Tồn kho:</strong> {product.StockQuantity}
        </p>
        <p>
          <strong>Danh mục:</strong> {product.CategoryName}
        </p>
      </div>
    </div>
  );
};

export default ProductDetail;
