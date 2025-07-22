// 🧠 Import thư viện và hook cần thiết
import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import "react-quill/dist/quill.snow.css"; // Giao diện
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
        console.log(res.data)
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
  const imageUrl = !product?.Image?.startsWith("http")
    ? UPLOAD_BASE + "/pictures/" + (product?.Image || "default.jpg")
    : product.Image;

    return (
      <div className="product-detail-container">
        {/* Loading */}
        {loading && (
          <div className="product-detail-loading">
            <div ref={loadingRef} className="product-detail-loading-animation" />
            <p>Đang tải thông tin sản phẩm...</p>
          </div>
        )}
    
        {!loading && (
          <>
            <div className="product-detail-actions">
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
    
            {product && (
              <div className="product-detail-breadcrumb">
                <span>Danh mục: {product.CategoryName}</span>
                {product.SubCategoryName && (
                  <>
                    <span className="breadcrumb-separator">{">"}</span>
                    <span>{product.SubCategoryName}</span>
                  </>
                )}
              </div>
            )}
    
            {product && (
              <>
                <div className="product-detail-wrapper show">
                  <div className="product-detail-body">
                    <div className="product-detail-image">
                      <img
                        src={imageUrl}
                        alt={product?.ProductName || "Không có tên"}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/images/placeholder.png";
                        }}
                      />
                    </div>
    
                    <div className="product-detail-info">
                      <h3>{product?.ProductName}</h3>
                      <div className="id-block">
                        <span className="product-id">Mã sản phẩm: {product?.ProductID}</span>
    
                        <div className="rating">
                          <i className="fa fa-star" />
                          <i className="fa fa-star" />
                          <i className="fa fa-star" />
                          <i className="fa fa-star" />
                          <i className="fa fa-star-half-o" />
                          <span className="rating-count">0 đánh giá</span>
                        </div>
                      </div>
    
                      <span className="price">
                        {Number(product?.Price)?.toLocaleString("vi-VN") + " đ"}
                        <span> (Đã bao gồm VAT)</span>
                      </span>
    
                      <p className="stock">
                        <strong>Tồn kho:</strong> {product?.StockQuantity}
                      </p>
                      <p className="lot">
                        <strong>Lô hàng:</strong> {product?.Lot || "Không có"}
                      </p>
                    </div>
                  </div>
                </div>
    
                <div className="product-info-group">
                  <div className="product-info-section product-description">
                    <span>Mô tả sản phẩm</span>
                    <div
                      className="content"
                      dangerouslySetInnerHTML={{ __html: product?.ProductDescription }}
                    />
                  </div>
    
                  <div className="product-info-section product-ingredients">
                    <span>Thành phần</span>
                    <div
                      className="content"
                      dangerouslySetInnerHTML={{ __html: product?.Ingredient }}
                    />
                  </div>
    
                  <div className="product-info-section product-usage">
                    <span>Công dụng</span>
                    <div
                      className="content"
                      dangerouslySetInnerHTML={{ __html: product?.Usage }}
                    />
                  </div>
    
                  <div className="product-info-section product-instructions">
                    <span>Hướng dẫn sử dụng</span>
                    <div
                      className="content"
                      dangerouslySetInnerHTML={{ __html: product?.HowToUse }}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
    
};

export default ProductDetail;
