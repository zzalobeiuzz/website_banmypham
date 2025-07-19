import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../../../constants";
import useHttp from "../../../../../hooks/useHttp";

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/user/products/${id}`);
        setProduct(res.data);
      } catch (error) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", error);
      }
    };

    fetchProduct();
  }, [id, request]);

  if (!product) return <p>Đang tải...</p>;

  return (
    <div>
      <h2>{product.ProductName}</h2>
      <img src={`URL_IMAGE/${product.Image}`} alt={product.ProductName} />
      <p>Giá: {product.Price.toLocaleString("vi-VN")}đ</p>
      <p>Tồn kho: {product.StockQuantity}</p>
      <p>Danh mục: {product.CategoryName}</p>
      {/* Thêm thông tin khác nếu cần */}
    </div>
  );
};

export default ProductDetail;
