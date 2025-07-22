import React, { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";
import axios from "axios";

const ProductDetail = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const loadingRef = useRef(null);

  // 👇 Fetch sản phẩm
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/api/products/${productId}`);
        setProduct(res.data.product);
      } catch (err) {
        console.error("❌ Lỗi load sản phẩm:", err);
      }
    };

    fetchProduct();
  }, [productId]);

  // 👇 Load animation khi product chưa có (tức là đang loading)
  useEffect(() => {
    if (!product && loadingRef.current) {
      const anim = lottie.loadAnimation({
        container: loadingRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/Trail loading.json",
      });

      return () => anim.destroy();
    }
  }, [product]);

  // 👉 Nếu chưa có dữ liệu thì hiện loading
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

  // 👉 Nếu có rồi thì hiển thị ảnh
  return (
    <div className="product-detail__wrapper">
      <div className="product-detail__image">
        <img
          src={`http://localhost:5000/uploads/assets/pictures/${product.Image || "default.jpg"}`}
          alt={product.ProductName || "Không có tên"}
          onError={(e) => {
            e.target.src = "/images/placeholder.png";
          }}
        />
      </div>

      <div className="product-detail__info">
        <h2>{product.ProductName}</h2>
        <p><strong>Giá:</strong> {product.Price}đ</p>
        <p><strong>Mô tả:</strong> {product.Description}</p>
      </div>
    </div>
  );
};

export default ProductDetail;
