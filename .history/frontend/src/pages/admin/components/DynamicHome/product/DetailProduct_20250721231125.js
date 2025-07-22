import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useParams } from "react-router-dom";
import { UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./style.scss";

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();
  const animationContainer = useRef(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [editFields, setEditFields] = useState({
    name: "",
    stockQuantity: "",
    intro: "",
    ingredients: "",
    usage: "",
    instructions: "",
  });

  // Quill cấu hình
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

  useEffect(() => {
    const getProductDetail = async () => {
      try {
        const res = await request.get(`/api/products/detail?code=${id}`);
        setProduct(res?.data);
      } catch (err) {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", err.message);
      } finally {
        setLoading(false);
      }
    };

    getProductDetail();
  }, [id]);

  useEffect(() => {
    if (product) {
      setEditFields({
        name: product.ProductName || "",
        stockQuantity: product.StockQuantity || "",
        intro: product.ProductDescription || "",
        ingredients: product.Ingredient || "",
        usage: product.Usage || "",
        instructions: product.HowToUse || "",
      });
    }
  }, [product]);

  useEffect(() => {
    if (animationContainer.current && loading) {
      const instance = lottie.loadAnimation({
        container: animationContainer.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/lottie/loading.json",
      });

      return () => instance?.destroy();
    }
  }, [loading]);

  const handleInputChange = (field, value) => {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="product-detail__loading">
        <div ref={animationContainer} className="product-detail__loading-animation" />
        <p>Đang tải dữ liệu sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="product-detail__container">
      <div className="product-detail__actions">
        <button className="btn-back" onClick={() => window.history.back()}>
          ⬅ Quay lại
        </button>
        <button className="btn-edit" onClick={() => setIsEdit(!isEdit)}>
          {isEdit ? "💾 Lưu" : "✏️ Sửa"}
        </button>
      </div>

      <div className="product-detail__content">
        <div className="product-detail__image">
          <img src={`${UPLOAD_BASE}/${product?.Image}`} alt={product?.ProductName} />
        </div>

        <div className="product-detail__info">
          {isEdit ? (
            <>
              <input
                type="text"
                value={editFields.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              <p>
                <strong>Tồn kho:</strong>{" "}
                <input
                  type="number"
                  value={editFields.stockQuantity}
                  onChange={(e) => handleInputChange("stockQuantity", e.target.value)}
                />
              </p>
            </>
          ) : (
            <>
              <h3>{product?.ProductName}</h3>
              <p className="stock">
                <strong>Tồn kho:</strong> {product?.StockQuantity}
              </p>
            </>
          )}
          <span className="product-id">Mã sản phẩm: {product?.ProductID}</span>
          <div className="rating">⭐ 0 đánh giá</div>
        </div>
      </div>

      <div className="product-detail__description">
        <div className="form-group" id="description">
          <label>Mô tả sản phẩm</label>
          {isEdit ? (
            <ReactQuill
              theme="snow"
              value={editFields.intro}
              onChange={(val) => handleInputChange("intro", val)}
              modules={quillModules}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: product?.ProductDescription }} />
          )}
        </div>

        <div className="form-group" id="ingredients">
          <label>Thành phần</label>
          {isEdit ? (
            <ReactQuill
              theme="snow"
              value={editFields.ingredients}
              onChange={(val) => handleInputChange("ingredients", val)}
              modules={quillModules}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: product?.Ingredient }} />
          )}
        </div>

        <div className="form-group" id="usage">
          <label>Công dụng</label>
          {isEdit ? (
            <ReactQuill
              theme="snow"
              value={editFields.usage}
              onChange={(val) => handleInputChange("usage", val)}
              modules={quillModules}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: product?.Usage }} />
          )}
        </div>

        <div className="form-group" id="instructions">
          <label>Hướng dẫn sử dụng</label>
          {isEdit ? (
            <ReactQuill
              theme="snow"
              value={editFields.instructions}
              onChange={(val) => handleInputChange("instructions", val)}
              modules={quillModules}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: product?.HowToUse }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
