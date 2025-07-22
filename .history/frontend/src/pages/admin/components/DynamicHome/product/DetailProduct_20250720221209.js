// 🧠 Import thư viện và hook cần thiết
import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./style.scss";

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();
  const navigate = useNavigate();
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
        console.log(res.data)
        setTimeout(() => setLoading(false), 1000);
      } catch (err) {
        console.error("❌ Không lấy được chi tiết sản phẩm:", err);
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
      {/* 🔄 Loading */}
      {loading && (
        <div className="product-detail__loading">
          <div ref={loadingRef} className="product-detail__loading-animation" />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      )}

      {/* ✅ Nội dung sau khi đã tải xong */}
      {!loading && (
        <>
          {/* 🔘 Thanh công cụ */}
          <div className="product-detail__actions">
            <div className="btn-back-wrapper">
              <button className="btn-back" onClick={() => navigate(-1)}>
                ⬅ Quay lại
              </button>
            </div>
            {product && (
              <div className="btn-group">
                <button className="btn-edit">✏️ Sửa</button>
                <button className="btn-delete">🗑️ Xóa</button>
                <button className="btn-hide">🙈 Ẩn</button>
              </div>
            )}
          </div>

          {product && (
            <div className="product-detail__wrapper show">
              {/* 📁 Đường dẫn danh mục */}
              <div className="product-detail__breadcrumb">
                {product.CategoryName}
                {/* Nếu SubCategoryName tồn tại và không rỗng, thì hiển thị chuỗi > tên_danh_mục_con */} 
                {product.SubCategoryName && ` > ${product.SubCategoryName}`}
              </div>
          
              {/* 🖼️ Ảnh sản phẩm */}
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
          
              {/* ℹ️ Thông tin sản phẩm */}
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
                  <strong>Danh mục:</strong>{" "}
                  {product?.SubCategoryName
                    ? `${product.CategoryName} > ${product.SubCategoryName}`
                    : product?.CategoryName}
                </p>
              </div>
            </div>
          )}
          
        </>
      )}
    </div>
  );
};

export default ProductDetail;
