import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
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
  const [isEdit, setIsEdit] = useState(false);

  const [editFields, setEditFields] = useState({
    ProductName: "",
    ProductDescription: "",
    Ingredient: "",
    Usage: "",
    HowToUse: "",
    StockQuantity: "",
    Lot: "",
    Image: null, // base64 or file
  });

  // Gọi API lấy chi tiết sản phẩm
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/admin/products/productDetail?code=${id}`);
        setProduct(res.data);
        setEditFields({
          ProductName: res.data.ProductName || "",
          ProductDescription: res.data.ProductDescription || "",
          Ingredient: res.data.Ingredient || "",
          Usage: res.data.Usage || "",
          HowToUse: res.data.HowToUse || "",
          StockQuantity: res.data.StockQuantity || "",
          Lot: res.data.Lot || "",
          Image: null,
        });
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

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleInputChange = (field, value) => {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleInputChange("Image", file);
    }
  };

  const imageUrl = !product?.Image?.startsWith("http")
    ? UPLOAD_BASE + "/pictures/" + (product?.Image || "default.jpg")
    : product.Image;

  return (
    <div className="product-detail__container">
      {loading && (
        <div className="product-detail__loading">
          <div ref={loadingRef} className="product-detail__loading-animation" />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="product-detail__actions">
            <button className="btn-back" onClick={() => navigate(-1)}>
              ⬅ Quay lại
            </button>
            {product && (
              <div className="btn-group">
                <button className="btn-edit" onClick={() => setIsEdit(!isEdit)}>
                  {isEdit ? "💾 Lưu" : "✏️ Sửa"}
                </button>
                <button className="btn-delete">🗑️ Xóa</button>
                <button className="btn-hide">🙈 Ẩn</button>
              </div>
            )}
          </div>

          <div className="product-detail__breadcrumb">
            <span>Danh mục: {product.CategoryName}</span>
            {product.SubCategoryID && (
              <>
                <span className="breadcrumb-separator">{">"}</span>
                <span>{product.SubCategoryName}</span>
              </>
            )}
          </div>

          <div className="product-detail__wrapper show">
            <div className="product-detail__body">
              {/* Hình ảnh */}
              <div className="product-detail__image">
                <img
                  src={imageUrl}
                  alt={editFields.ProductName}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/placeholder.png";
                  }}
                />
                {isEdit && (
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                )}
              </div>

              {/* Thông tin chung */}
              <div className="product-detail__info">
                {isEdit ? (
                  <input
                    value={editFields.ProductName}
                    onChange={(e) => handleInputChange("ProductName", e.target.value)}
                    placeholder="Tên sản phẩm"
                  />
                ) : (
                  <h3>{product.ProductName}</h3>
                )}

                <div className="id-block">
                  <span className="product-id">Mã sản phẩm: {product.ProductID}</span>

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
                  {Number(product.Price)?.toLocaleString("vi-VN") + " đ"}
                  <span> (Đã bao gồm VAT)</span>
                </span>

                {isEdit ? (
                  <>
                    <p className="stock">
                      <strong>Tồn kho:</strong>{" "}
                      <input
                        value={editFields.StockQuantity}
                        onChange={(e) => handleInputChange("StockQuantity", e.target.value)}
                      />
                    </p>
                    <p className="lot">
                      <strong>Lô hàng:</strong>{" "}
                      <input
                        value={editFields.Lot}
                        onChange={(e) => handleInputChange("Lot", e.target.value)}
                      />
                    </p>
                  </>
                ) : (
                  <>
                    <p className="stock">
                      <strong>Tồn kho:</strong> {product.StockQuantity}
                    </p>
                    <p className="lot">
                      <strong>Lô hàng:</strong> {product.Lot || "Không có"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="product-info-nav">
            <button onClick={() => scrollToSection("description")}>Mô tả</button>
            <button onClick={() => scrollToSection("ingredients")}>Thành phần</button>
            <button onClick={() => scrollToSection("usage")}>Công dụng</button>
            <button onClick={() => scrollToSection("instructions")}>Hướng dẫn</button>
          </div>

          <div className="product-info-group">
            {/* Mô tả */}
            <div className="product-info-section product-description" id="description">
              <span>Mô tả sản phẩm</span>
              {isEdit ? (
                <ReactQuill
                  value={editFields.ProductDescription}
                  onChange={(value) => handleInputChange("ProductDescription", value)}
                />
              ) : (
                <div className="content" dangerouslySetInnerHTML={{ __html: product.ProductDescription }} />
              )}
            </div>

            {/* Thành phần */}
            <div className="product-info-section product-ingredients" id="ingredients">
              <spanclassName="product-info-section__label">Thành phần</spanclassName=>
              {isEdit ? (
                <ReactQuill
                  value={editFields.Ingredient}
                  onChange={(value) => handleInputChange("Ingredient", value)}
                />
              ) : (
                <div className="content" dangerouslySetInnerHTML={{ __html: product.Ingredient }} />
              )}
            </div>

            {/* Công dụng */}
            <div className="product-info-section product-usage" id="usage">
              <span>Công dụng</span>
              {isEdit ? (
                <ReactQuill
                  value={editFields.Usage}
                  onChange={(value) => handleInputChange("Usage", value)}
                />
              ) : (
                <div className="content" dangerouslySetInnerHTML={{ __html: product.Usage }} />
              )}
            </div>

            {/* Hướng dẫn */}
            <div className="product-info-section product-instructions" id="instructions">
              <span>Hướng dẫn sử dụng</span>
              {isEdit ? (
                <ReactQuill
                  value={editFields.HowToUse}
                  onChange={(value) => handleInputChange("HowToUse", value)}
                />
              ) : (
                <div className="content" dangerouslySetInnerHTML={{ __html: product.HowToUse }} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductDetail;
