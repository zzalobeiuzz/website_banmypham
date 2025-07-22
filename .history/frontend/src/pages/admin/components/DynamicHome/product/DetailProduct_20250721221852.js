// 🧠 IMPORT CÁC THƯ VIỆN VÀ COMPONENT
import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill"; // 📝 Trình soạn thảo văn bản
import "react-quill/dist/quill.snow.css"; // ✅ Đảm bảo đã import theme
import { useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./style.scss";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();
  const animationRef = useRef(null);

  const [product, setProduct] = useState({});
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🟢 Lấy chi tiết sản phẩm theo mã
  const fetchProduct = async () => {
    try {
      const res = await request.get(`${API_BASE}/products/detail/${id}`);
      if (res.success) {
        setProduct(res.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết sản phẩm:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  // 🔁 Gọi API khi component mount
  useEffect(() => {
    fetchProduct();
  }, );

  // 🌀 Tải animation khi loading
  useEffect(() => {
    if (isLoading && animationRef.current) {
      const anim = lottie.loadAnimation({
        container: animationRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/loading.json",
      });
      return () => anim.destroy();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="product-detail__loading">
        <div className="product-detail__loading-animation" ref={animationRef} />
        <div className="product-detail__loading-text">Đang tải sản phẩm...</div>
      </div>
    );
  }

  return (
    <div className="product-detail__container">
      <div className="product-detail__actions">
        <button className="btn-back">Quay lại</button>
        <button className="btn-edit" onClick={() => setIsEdit(!isEdit)}>
          {isEdit ? "Lưu chỉnh sửa" : "Chỉnh sửa"}
        </button>
      </div>

      {/* Hình ảnh sản phẩm */}
      {product.Image && (
        <div className="product-detail__image">
          <img src={`${UPLOAD_BASE}/${product.Image}`} alt={product.ProductName} />
        </div>
      )}

      {/* Tên sản phẩm */}
      <h2 className="product-detail__title">{product.ProductName}</h2>

      {/* Mô tả sản phẩm */}
      <div className="product-detail__section">
        <h3 className="product-detail__section-title">Mô tả sản phẩm</h3>
        {isEdit ? (
          <ReactQuill
            theme="snow"
            modules={quillModules}
            value={product.ProductDescription || ""}
            onChange={(value) => handleInputChange("ProductDescription", value)}
          />
        ) : (
          <div
            className="product-detail__html"
            dangerouslySetInnerHTML={{ __html: product.ProductDescription || "<em>Không có mô tả</em>" }}
          />
        )}
      </div>

      {/* Thành phần */}
      <div className="product-detail__section">
        <h3 className="product-detail__section-title">Thành phần</h3>
        {isEdit ? (
          <ReactQuill
            theme="snow"
            modules={quillModules}
            value={product.Ingredients || ""}
            onChange={(value) => handleInputChange("Ingredients", value)}
          />
        ) : (
          <div
            className="product-detail__html"
            dangerouslySetInnerHTML={{ __html: product.Ingredients || "<em>Không có thông tin</em>" }}
          />
        )}
      </div>

      {/* Hướng dẫn sử dụng */}
      <div className="product-detail__section">
        <h3 className="product-detail__section-title">Hướng dẫn sử dụng</h3>
        {isEdit ? (
          <ReactQuill
            theme="snow"
            modules={quillModules}
            value={product.Usage || ""}
            onChange={(value) => handleInputChange("Usage", value)}
          />
        ) : (
          <div
            className="product-detail__html"
            dangerouslySetInnerHTML={{ __html: product.Usage || "<em>Không có hướng dẫn</em>" }}
          />
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
