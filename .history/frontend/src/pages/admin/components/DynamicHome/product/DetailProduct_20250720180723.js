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
  const loadingRef = useRef(); // 📍 DOM ref cho Lottie animation

  // 🎞️ Load animation loading khi chưa có dữ liệu
  useEffect(() => {
    if (!product && loadingRef.current) {
      const anim = lottie.loadAnimation({
        container: loadingRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/Trail loading.json", // 🔁 File animation trong /public
      });

      return () => anim.destroy(); // 💥 Xoá animation khi component unmount
    }
  }, [product]);

  // 🚀 Gọi API lấy chi tiết sản phẩm theo mã
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        setProduct(res.data);
      } catch (error) {
        console.error("❌ Lỗi khi tải chi tiết sản phẩm:", error);
      }
    };

    fetchProduct();
  }, [id, request]);

  // 🔄 Nếu chưa có dữ liệu → hiển thị animation loading
  if (!product) {
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

  // ✅ Nếu có dữ liệu → render chi tiết sản phẩm
  return (
    <div className="product-detail__wrapper">
    <h1>ừaasfasdsfasdfs</h1>
      <div className="product-detail__image">
      
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
