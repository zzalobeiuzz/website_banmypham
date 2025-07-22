// 🧠 Import thư viện và hook cần thiết
import lottie from "lottie-web"; // 🎞️ Thư viện để hiển thị animation Lottie
import React, { useEffect, useRef, useState } from "react"; // 📦 React hooks
import { useParams } from "react-router-dom"; // 🔁 Lấy params từ URL
import { API_BASE, UPLOAD_BASE } from "../../../../../constants"; // 🔗 Các hằng số URL API và upload
import useHttp from "../../../../../hooks/useHttp"; // 📡 Custom hook xử lý request
import "./style.scss"; // 🎨 SCSS riêng cho component

const ProductDetail = () => {
  const { id } = useParams(); // 📌 Lấy mã sản phẩm từ URL
  const { request } = useHttp(); // 🔧 Dùng custom hook để gọi API

  const loadingRef = useRef(); // 🔁 Ref DOM dùng cho animation Lottie
  const [product, setProduct] = useState(null); // 🧠 Trạng thái dữ liệu sản phẩm
  const [loading, setLoading] = useState(true); // ⌛ Trạng thái loading
  const [showContent, setShowContent] = useState(false); // 👁️ Trạng thái hiển thị nội dung

  // 🛎️ Gọi API khi component mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        setProduct(res.data);
        console.log("🔍 Product:", res.data);

        // 🕒 Delay 1.5s để đảm bảo animation hiển thị trước
        setTimeout(() => {
          setShowContent(true);
          setLoading(false);
        }, 1500);
      } catch (err) {
        console.error("❌ Không lấy được chi tiết sản phẩm:", err);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, request]);

  // 🌈 Chạy animation nếu đang loading
  useEffect(() => {
    if (loadingRef.current && loading) {
      const anim = lottie.loadAnimation({
        container: loadingRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/Trail loading.json",
      });

      return () => anim.destroy(); // 🧹 Cleanup khi unmount hoặc loading xong
    }
  }, [loading]);

  // 🔒 Nếu chưa có product hoặc đang loading thì render animation
  if (!product?.ProductName || !showContent) {
    return (
      <div className="product-detail__loading">
        <div
          ref={loadingRef}
          className="product-detail__lottie"
        />
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  // ✅ Đến đây chắc chắn đã có product => xử lý ảnh
  const imageUrl = product.Image?.startsWith("http")
    ? product.Image
    : `${UPLOAD_BASE}/pictures/${product.Image || "default.jpg"}`;

  return (
    <div className="product-detail__container">
      <div className="product-detail__wrapper show">
        {/* Hình ảnh */}
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
