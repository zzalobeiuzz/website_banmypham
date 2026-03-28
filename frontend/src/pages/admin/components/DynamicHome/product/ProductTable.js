import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./style.scss";

const productSections = [
  {
    label: "Mô tả sản phẩm",
    field: "ProductDescription",
    id: "description",
    className: "product-description",
  },
  {
    label: "Thành phần",
    field: "Ingredient",
    id: "ingredients",
    className: "product-ingredients",
  },
  {
    label: "Công dụng",
    field: "Usage",
    id: "usage",
    className: "product-usage",
  },
  {
    label: "Hướng dẫn sử dụng",
    field: "HowToUse",
    id: "instructions",
    className: "product-instructions",
  },
];

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();
  const navigate = useNavigate();
  const loadingRef = useRef();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const [editFields, setEditFields] = useState({
    ProductName: "",
    ProductDescription: "",
    Ingredient: "",
    Usage: "",
    HowToUse: "",
    StockQuantity: "",
    Lot: "",
    Image: null,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
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
          CategoryID: res.data.CategoryID || "",
          SubCategoryID: res.data.SubCategoryID || "",
        });

        setTimeout(() => setLoading(false), 1000);
      } catch (err) {
        console.error("❌ Không lấy được chi tiết sản phẩm:", err);
      }
    };
    fetchProduct();
  }, [id, request]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/user/products/loadCategory`
        );
        setCategories(res.data || []);
      } catch (error) {
        console.error("❌ Lỗi lấy danh mục:", error.message);
      }
    };
    fetchCategories();
  }, [request]);

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
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleInputChange = (field, value) => {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  };
  const handleImageDrop = (e) => {
    e.preventDefault();
    if (!isEdit) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImageName(file.name);
      setEditFields((prev) => ({ ...prev, Image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => {
    if (isEdit) e.preventDefault(); // Cho phép thả
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImageName(file.name);
      setEditFields((prev) => ({ ...prev, Image: file }));
      setPreviewImage(URL.createObjectURL(file));
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
            <span>Danh mục: </span>

            {isEdit ? (
              <>
                <div className="category-selects">
                  <select
                    value={editFields.CategoryID}
                    onChange={(e) => {
                      handleInputChange("CategoryID", e.target.value);
                      handleInputChange("SubCategoryID", "");
                    }}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.CategoryID} value={cat.CategoryID}>
                        {cat.CategoryName}
                      </option>
                    ))}
                  </select>

                  {editFields.CategoryID && (
                    <>
                      <span className="breadcrumb-separator">{">"}</span>
                      <select
                        value={editFields.SubCategoryID}
                        onChange={(e) =>
                          handleInputChange("SubCategoryID", e.target.value)
                        }
                      >
                        <option value="">-- Chọn danh mục con --</option>
                        {categories
                          .find(
                            (cat) => cat.CategoryID === editFields.CategoryID
                          )
                          ?.SubCategories?.map((sub) => (
                            <option
                              key={sub.SubCategoryID}
                              value={sub.SubCategoryID}
                            >
                              {sub.SubCategoryName}
                            </option>
                          ))}
                      </select>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <span>{product.CategoryName}</span>
                {product.SubCategoryID && (
                  <>
                    <span className="breadcrumb-separator">{">"}</span>
                    <span>{product.SubCategoryName}</span>
                  </>
                )}
              </>
            )}
          </div>

          <div className="product-detail__wrapper show">
            <div className="product-detail__body">
              <div
                className="product-detail__image"
                onDrop={handleImageDrop}
                onDragOver={handleDragOver}
              >
                <img
                  src={previewImage || imageUrl}
                  alt={editFields.ProductName}
                  onClick={() =>
                    isEdit && document.getElementById("imageInput").click()
                  }
                  style={{ cursor: isEdit ? "pointer" : "default" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
                  }}
                />

                {isEdit && (
                  <div className="upload-wrapper">
                    <input
                      type="file"
                      id="imageInput"
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="imageInput" className="btn-select-image">
                      📁 Chọn ảnh
                    </label>
                    {selectedImageName && (
                      <div className="image-name">{selectedImageName}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="product-detail__info">
                {isEdit ? (
                  <input
                    className="productName-input"
                    value={editFields.ProductName}
                    onChange={(e) =>
                      handleInputChange("ProductName", e.target.value)
                    }
                    placeholder="Tên sản phẩm"
                  />
                ) : (
                  <h3>{product.ProductName}</h3>
                )}

                <div className="id-block">
                  <span className="product-id">
                    Mã sản phẩm: {product.ProductID}
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
                  {Number(product.Price)?.toLocaleString("vi-VN") + " đ"}
                  <span> (Đã bao gồm VAT)</span>
                </span>

                {isEdit ? (
                  <>
                    <p className="stock">
                      <strong>Tồn kho:</strong>
                      <input
                        value={editFields.StockQuantity}
                        onChange={(e) =>
                          handleInputChange("StockQuantity", e.target.value)
                        }
                      />
                    </p>
                    <p className="lot">
                      <strong>Lô hàng:</strong>
                      <input
                        value={editFields.Lot}
                        onChange={(e) =>
                          handleInputChange("Lot", e.target.value)
                        }
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
            {productSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="product-info-group">
            {productSections.map(({ label, field, id, className }) => (
              <div
                className={`product-info-section ${className}`}
                id={id}
                key={field}
              >
                <span className="product-info-section__label">{label}</span>
                {isEdit ? (
                  <ReactQuill
                    value={editFields[field]}
                    onChange={(value) => handleInputChange(field, value)}
                  />
                ) : (
                  <div
                    className="content"
                    dangerouslySetInnerHTML={{ __html: product[field] }}
                  />
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
