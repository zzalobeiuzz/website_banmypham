import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import ImageUploader from "../../../../../utils/patchedUploader";
import "./style.scss";

Quill.register("modules/imageUploader", ImageUploader);

// ==================== ⚙️ CẤU HÌNH TOOLBAR CHO REACT QUILL ====================
const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["image", "link"],
    ["clean"],
  ],
  imageUploader: {
    // 📤 Hàm upload ảnh vào trình soạn thảo → Chuyển file thành base64
    upload: async (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // ✅ Trả về chuỗi base64
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
  },
};

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();
  const navigate = useNavigate();
  const loadingRef = useRef();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        setProduct(res.data);
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

  const handleInputChange = (field, value) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProduct((prev) => ({ ...prev, Image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const imageUrl = product?.Image?.startsWith("http")
    ? product.Image
    : product?.Image?.startsWith("data")
    ? product.Image
    : `${UPLOAD_BASE}/pictures/${product?.Image || "default.jpg"}`;


  return (
    <div className="product-detail__container">
      {loading && (
        <div className="product-detail__loading">
          <div ref={loadingRef} className="product-detail__loading-animation" />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      )}

      {!loading && product && (
        <>
          <div className="product-detail__actions">
            <button className="btn-back" onClick={() => navigate(-1)}>
              ⬅ Quay lại
            </button>
            <div className="btn-group">
              <button className="btn-edit" onClick={() => setIsEdit(!isEdit)}>
                {isEdit ? "💾 Lưu" : "✏️ Sửa"}
              </button>
              <button className="btn-delete">🗑️ Xóa</button>
              <button className="btn-hide">🙈 Ẩn</button>
            </div>
          </div>

          <div className="product-detail__wrapper show">
            <div className="product-detail__body">
              <div className="product-detail__image">
                <img
                  src={imageUrl}
                  alt={product?.ProductName || "Không có tên"}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/placeholder.png";
                  }}
                />
                {isEdit && <input type="file" onChange={handleImageUpload} />}
              </div>

              <div className="product-detail__info">
                {isEdit ? (
                  <input
                    type="text"
                    value={product.ProductName || ""}
                    onChange={(e) => handleInputChange("ProductName", e.target.value)}
                  />
                ) : (
                  <h3>{product?.ProductName}</h3>
                )}

                <div className="id-block">
                  <span className="product-id">
                    Mã sản phẩm: {product?.ProductID}
                  </span>
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
            <div className="product-info-section" id="description">
              <span>Mô tả sản phẩm</span>
              {renderQuillOrContent("ProductDescription")}
            </div>

            <div className="product-info-section" id="ingredients">
              <span>Thành phần</span>
              {renderQuillOrContent("Ingredient")}
            </div>

            <div className="product-info-section" id="usage">
              <span>Công dụng</span>
              {renderQuillOrContent("Usage")}
            </div>

            <div className="product-info-section" id="instructions">
              <span>Hướng dẫn sử dụng</span>
              {renderQuillOrContent("HowToUse")}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductDetail;
