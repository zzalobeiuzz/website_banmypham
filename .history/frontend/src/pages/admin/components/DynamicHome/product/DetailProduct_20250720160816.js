// 🧠 Import thư viện React và hook cần thiết
import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"; // 🔄 Lấy param từ URL
import { API_BASE, UPLOAD_BASE } from "../../../../../constants"; // 🌐 URL base API server
import useHttp from "../../../../../hooks/useHttp"; // 🛠️ Custom hook để gọi API

// 📦 Component hiển thị chi tiết sản phẩm
const ProductDetail = () => {
  const { id } = useParams(); // 🔎 Lấy id từ URL
  const { request } = useHttp(); // API hook
  const [product, setProduct] = useState(null);

  const loadingRef = useRef(); // 📍 DOM ref cho Lottie

  // 🎞️ Load animation Lottie khi chưa có sản phẩm
  useEffect(() => {
    if (!product && loadingRef.current) {
      const anim = lottie.loadAnimation({
        container: loadingRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/Trail loading.json", // 🔁 Đường dẫn tương đối trong /public
      });

      return () => anim.destroy(); // 💥 Dọn dẹp khi unmount
    }
  }, [product]);

  // 🚀 Gọi API lấy sản phẩm
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        setProduct(res.data);
        console.log(res.data)
        // console.log(res.data)
      } catch (error) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", error);
      }
    };
    fetchProduct();
  }, [id, request]);

  // 🔄 Nếu chưa có dữ liệu → render animation
  if (!product) {
    return (
      <div className="product-detail__loading">
        <div ref={loadingRef} style={{ width: 250, height: 250, margin: "0 auto" }} />
        <p style={{ textAlign: "center", marginTop: 12 }}>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  // ✅ Nếu có dữ liệu → render sản phẩm
  return (
    <div className="product-detail__wrapper">
      <div className="product-detail__image">
        <img src={`${UPLOAD_BASE}/${product.Image}`} alt={product.ProductName} />
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
