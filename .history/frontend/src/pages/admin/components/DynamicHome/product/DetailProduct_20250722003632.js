// 🧠 Import thư viện và hook cần thiết
import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./style.scss";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["image", "link"],
    ["clean"]
  ],
  imageUploader: {
    upload: async (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }
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
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
  
        const data = res.data;
  
        setProduct(data); // Có thể dùng để hiển thị readonly
        setEditFields({
          name: data.ProductName || "",
          stock: data.StockQuantity || 0,
          intro: data.ProductDescription || "",
          ingredients: data.Ingredient || "",
          usage: data.Usage || "",
          instructions: data.HowToUse || ""
        });
  
        setTimeout(() => setLoading(false), 1000);
      } catch (err) {
        console.error("❌ Không lấy được chi tiết sản phẩm:", err);
      }
    };
  
    fetchProduct();
  }, [id]); // ✅ Không cần request trong deps nếu dùng đúng
  
  

  useEffect(() => {
    if (loadingRef.current && loading) {
      const anim = lottie.loadAnimation({
        container: loadingRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/Trail loading.json"
      });
      return () => anim.destroy();
    }
  }, [loading]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const imageUrl = !product?.Image?.startsWith("http")
    ? UPLOAD_BASE + "/pictures/" + (product?.Image || "default.jpg")
    : product.Image;

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
                <button className="btn-delete">🗑️ Xóa</button>
                <button className="btn-hide">🙈 Ẩn</button>
              </div>
            )}
          </div>

          {product && (
            <div className="product-detail__breadcrumb">
              <span>Danh mục: {product.CategoryName}</span>
              {product.SubCategoryID && (
                <>
                  <span className="breadcrumb-separator">{">"}</span>
                  <span>{product.SubCategoryName}</span>
                </>
              )}
            </div>
          )}

          {product && (
            <>
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
                        value={editFields.name}
                        onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                      />
                    ) : (
                      <h3>{product?.ProductName}</h3>
                    )}

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
                      <strong>Tồn kho:</strong>{" "}
                      {isEdit ? (
                        <input
                          value={editFields.stock}
                          onChange={(e) => setEditFields({ ...editFields, stock: e.target.value })}
                          style={{ width: 80 }}
                        />
                      ) : (
                        product?.StockQuantity
                      )}
                    </p>
                    <p className="lot">
                      <strong>Lô hàng:</strong> {product?.Lot || "Không có"}
                    </p>
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
                  { label: "Hướng dẫn sử dụng", id: "instructions", key: "instructions" }
                ].map(({ label, id, key }) => (
                  <div key={id} className="product-info-section" id={id}>
                    <span>{label}</span>
                    {isEdit ? (
                      <ReactQuill
                        theme="snow"
                        modules={quillModules}
                        value={editFields[key] || ""}
                        onChange={(val) => setEditFields({ ...editFields, [key]: val })}
                      />
                    ) : (
                      <div
                        className="content"
                        dangerouslySetInnerHTML={{
                          __html: product[
                            key === "intro"
                              ? "ProductDescription"
                              : key.charAt(0).toUpperCase() + key.slice(1)
                          ]
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ProductDetail;
