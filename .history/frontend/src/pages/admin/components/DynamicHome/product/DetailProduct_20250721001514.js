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

  // 📦 Gọi API lấy thông tin sản phẩm theo mã
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        setProduct(res.data);
        setTimeout(() => setLoading(false), 1000); // Giả lập delay loading
      } catch (err) {
        console.error("❌ Không lấy được chi tiết sản phẩm:", err);
      }
    };
    fetchProduct();
  }, [id, request]);

  // 🔁 Khởi tạo animation loading với Lottie
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

  // 📷 Xử lý ảnh sản phẩm
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
            <button className="btn-back" onClick={() => navigate(-1)}>
              ⬅ Quay lại
            </button>
            {product && (
              <div className="btn-group">
                <button className="btn-edit">✏️ Sửa</button>
                <button className="btn-delete">🗑️ Xóa</button>
                <button className="btn-hide">🙈 Ẩn</button>
              </div>
            )}
          </div>

          {/* 🧭 Breadcrumb - Đặt ngoài wrapper */}
          {product && (
            <div className="product-detail__breadcrumb">
              <span>Danh mục: {product.CategoryName}</span>
              {product.SubCategoryName && (
                <>
                  <span className="breadcrumb-separator">{'>'}</span>
                  <span>{product.SubCategoryName}</span>
                </>
              )}
            </div>
          )}

          {/* 📦 Thông tin sản phẩm */}
          {product && (
            <>
            <div className ="product-detail__wrapper show></div>
              <div className="">
                {/* 🖼️ Hình ảnh */}
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
          
                {/* ℹ️ Chi tiết sản phẩm */}
                <div className="product-detail__info">
                  <h3>{product?.ProductName}</h3>
          
                  <span className="product-id">
                    Mã sản phẩm: {product?.ProductID}
                  </span>
          
                  <p className="price">
                    {Number(product?.Price)?.toLocaleString("vi-VN") + " đ"}
                    <span> (Đã bao gồm VAT)</span>
                  </p>
          
                  <p className="stock">
                    <strong>Tồn kho:</strong> {product?.StockQuantity}
                  </p>
          
                  <p className="lot">
                    <strong>Lô hàng:</strong> {product?.Lot || "Không có"}
                  </p>
                </div>
              </div>
          
              <div className="info">
                <div className="ProductDescription">ProductDescription</div>
              </div>
            </>
          )}
          

    </>
  )
}
    </div >
  );

};

export default ProductDetail;
