// 🧠 Import thư viện React và hook cần thiết
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // 🔄 Lấy param từ URL
import { API_BASE } from "../../../../../constants"; // 🌐 URL base API server
import useHttp from "../../../../../hooks/useHttp"; // 🛠️ Custom hook để gọi API

// 📦 Component hiển thị chi tiết sản phẩm
const ProductDetail = () => {
  // 🔎 Lấy `id` từ URL: /products/:id
  const { id } = useParams();

  // 🧲 Dùng custom hook để gọi API
  const { request } = useHttp();

  // 🧮 Khai báo state lưu thông tin sản phẩm
  const [product, setProduct] = useState(null);

  // 🚀 Gọi API lấy thông tin sản phẩm khi component mount hoặc id thay đổi
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // 📨 Gọi API theo ID sản phẩm
        const res = await request("GET", `${API_BASE}/api/admin/products/checkProductExistence?code=${barcode}`);

        // ✅ Lưu dữ liệu vào state
        setProduct(res.data);
      } catch (error) {
        // ❌ Xử lý lỗi (console hoặc thông báo)
        console.error("Lỗi khi tải chi tiết sản phẩm:", error);
      }
    };

    fetchProduct(); // ⏯️ Thực thi
  }, [id, request]);

  // 🕓 Nếu chưa có dữ liệu, hiển thị "Đang tải..."
  if (!product) return <p>Đang tải...</p>;

  // ✅ Giao diện hiển thị thông tin chi tiết sản phẩm
  return (
    <div className="product-detail">
      <h2>{product.ProductName}</h2>

      {/* 📷 Hiển thị hình ảnh sản phẩm (thay URL_IMAGE bằng URL thật của bạn) */}
      <img
        src={`URL_IMAGE/${product.Image}`}
        alt={product.ProductName}
        style={{ width: "300px", height: "auto" }}
      />

      <p>
        <strong>Giá:</strong>{" "}
        {product.Price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
      </p>
      <p>
        <strong>Tồn kho:</strong> {product.StockQuantity}
      </p>
      <p>
        <strong>Danh mục:</strong> {product.CategoryName}
      </p>

      {/* 🔧 Bạn có thể hiển thị thêm các trường như: Mô tả, Thương hiệu, Khuyến mãi... */}
    </div>
  );
};

export default ProductDetail;
