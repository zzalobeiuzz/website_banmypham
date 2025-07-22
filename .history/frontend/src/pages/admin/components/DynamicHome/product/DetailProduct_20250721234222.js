// 🧠 Import thư viện và hook cần thiết
import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Giao diện
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./style.scss";

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
    upload: async (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
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
  const [editFields, setEditFields] = useState({});

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/admin/products/productDetail?code=${id}`);
        setProduct(res.data);
        setEditFields({
          name: res.data.ProductName,
          stock: res.data.StockQuantity,
          intro: res.data.ProductDescription,
          ingredients: res.data.Ingredient,
          usage: res.data.Usage,
          instructions: res.data.HowToUse,
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

  const handleChange = (field, value) => {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  };

  const imageUrl = !product?.Image?.startsWith("http")
    ? `${UPLOAD_BASE}/pictures/${product?.Image || "default.jpg"}`
    : product.Image;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="product-detail__container">
      {loading ? (
        <div className="product-detail__loading">
          <div ref={loadingRef} className="product-detail__loading-animation" />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      ) : (
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

              <div className="product-detail__info">
                {isEdit ? (
                  <input
                    type="text"
                    value={editFields.name}
                    onChange={(e) => handleChange("name", e.target.value)}
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

                {isEdit ? (
                  <p className="stock">
                    <strong>Tồn kho:</strong>
                    <input
                      type="number"
                      value={editFields.stock}
                      onChange={(e) => handleChange("stock", e.target.value)}
                    />
                  </p>
                ) : (
                  <p className="stock">
                    <strong>Tồn kho:</strong> {product.StockQuantity}
                  </p>
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
            {[
              { label: "Mô tả sản phẩm", id: "description", key: "intro" },
              { label: "Thành phần", id: "ingredients", key: "ingredients" },
              { label: "Công dụng", id: "usage", key: "usage" },
              { label: "Hướng dẫn sử dụng", id: "instructions", key: "instructions" },
            ].map(({ label, id, key }) => (
              <div key={id} className="product-info-section" id={id}>
                <span>{label}</span>
                {isEdit ? (
                  <ReactQuill
                    theme="snow"
                    value={editFields[key]}
                    onChange={(value) => handleChange(key, value)}
                    modules={quillModules}
                  />
                ) : (
                  <div className="content" dangerouslySetInnerHTML={{ __html: product[key === "intro" ? "ProductDescription" : key.charAt(0).toUpperCase() + key.slice(1)] }} />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductDetail;
