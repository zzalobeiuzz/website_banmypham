import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useParams } from "react-router-dom";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./style.scss";

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const [editFields, setEditFields] = useState({
    name: "",
    stock: 0,
    intro: "",
    ingredients: "",
    usage: "",
    instructions: ""
  });

  const loadingContainer = useRef(null);

  // 🌟 Lottie loading animation
  useEffect(() => {
    if (loadingContainer.current) {
      lottie.loadAnimation({
        container: loadingContainer.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/loading.json"
      });
    }
  }, []);

  // 📦 Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        const data = res.data;
        setProduct(data);
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
  }, [id]);

  // ✏️ Toggle edit mode
  const toggleEdit = () => setIsEdit((prev) => !prev);

  // 📝 Quill toolbar cấu hình cơ bản
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["image", "link"],
      ["clean"]
    ]
  };

  return (
    <div className="product-detail__container">
      {loading ? (
        <div className="product-detail__loading">
          <div className="product-detail__loading-animation" ref={loadingContainer} />
          <p>Đang tải dữ liệu sản phẩm...</p>
        </div>
      ) : (
        <>
          <div className="product-detail__actions">
            <button className="btn-back" onClick={() => window.history.back()}>
              Quay lại
            </button>
            <button className="btn-edit" onClick={toggleEdit}>
              {isEdit ? "Hủy chỉnh sửa" : "Chỉnh sửa"}
            </button>
          </div>

          <div className="product-detail__info">
            <p><strong>Mã sản phẩm:</strong> {product?.ProductCode}</p>
            <p><strong>Ngày tạo:</strong> {product?.CreatedDate}</p>
            <p><strong>Ngày cập nhật:</strong> {product?.ModifiedDate}</p>
          </div>

          <div className="product-detail__form">
            <div className="form-field">
              <label>Tên sản phẩm:</label>
              {isEdit ? (
                <input
                  value={editFields.name}
                  onChange={(e) =>
                    setEditFields({ ...editFields, name: e.target.value })
                  }
                />
              ) : (
                <span>{product?.ProductName}</span>
              )}
            </div>

            <div className="form-field">
              <label>Số lượng:</label>
              {isEdit ? (
                <input
                  type="number"
                  value={editFields.stock}
                  onChange={(e) =>
                    setEditFields({ ...editFields, stock: e.target.value })
                  }
                />
              ) : (
                <span>{product?.StockQuantity}</span>
              )}
            </div>

            {["intro", "ingredients", "usage", "instructions"].map((key) => (
              <div className="form-field" key={key}>
                <label>
                  {key === "intro"
                    ? "Giới thiệu"
                    : key === "ingredients"
                    ? "Thành phần"
                    : key === "usage"
                    ? "Công dụng"
                    : "Hướng dẫn sử dụng"}
                </label>
                <ReactQuill
                  theme="snow"
                  modules={quillModules}
                  value={typeof editFields[key] === "string" ? editFields[key] : ""}
                  readOnly={!isEdit}
                  onChange={(val) =>
                    isEdit && setEditFields({ ...editFields, [key]: val })
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductDetail;
