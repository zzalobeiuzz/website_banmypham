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
  const [editFields, setEditFields] = useState({});

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

  // Hàm cuộn đến khối
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  // 📷 Xử lý ảnh sản phẩm
  const imageUrl = !product?.Image?.startsWith("http")
    ? UPLOAD_BASE + "/pictures/" + (product?.Image || "default.jpg")
    : product.Image;

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
              {product.SubCategoryID && (
                <>
                  <span className="breadcrumb-separator">{">"}</span>
                  <span>{product.SubCategoryName}</span>
                </>
              )}
            </div>
          )}

          {/* 📦 Thông tin sản phẩm */}
          {product && (
            <>
              <div className="product-detail__wrapper show">
                <div className="product-detail__body">
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
                    <div className="id-block">
                      <span className="product-id">
                        Mã sản phẩm: {product?.ProductID}
                      </span>

                      <div className="rating">
                        {/* ⭐ Hiển thị 4.5 sao (ví dụ cứng) */}
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
        </>
      )}
    </div>
  );
};

export default ProductDetail;
