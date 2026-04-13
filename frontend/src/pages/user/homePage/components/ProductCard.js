// ProductCard.js
import React from "react";
import { Link } from "react-router-dom";

/**
 * ProductCard - Card sản phẩm dùng chung cho trang chủ và trang thương hiệu
 * @param {object} props
 * @param {object} props.item - Thông tin sản phẩm
 * @param {function} props.onAddToCart - Hàm xử lý thêm vào giỏ hàng
 * @param {string} props.detailUrl - Đường dẫn chi tiết sản phẩm
 * @param {function} props.resolveProductImage - Hàm lấy link ảnh sản phẩm
 * @param {number} [props.cardIndex] - Index để animation
 */
export default function ProductCard({ item, onAddToCart, detailUrl, resolveProductImage, cardIndex }) {
  return (
    <Link
      to={detailUrl}
      className="brand-product-card"
      style={{ "--card-index": cardIndex }}
    >
      <img
        src={resolveProductImage(item.Image)}
        alt={item.ProductName || "product"}
        loading="lazy"
      />
      <button
        className="add-cart-plus-btn"
        title="Thêm vào giỏ hàng"
        onClick={(e) => onAddToCart(e, item)}
      >
        <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>+</span>
      </button>
      <div className="brand-product-card__code">
        Mã: {String(item?.ProductCode || item?.code || item?.product_code || item?.ProductID || "")}
      </div>
      <div
        className="brand-product-card__name"
        title={item.ProductName}
      >
        {item.ProductName}
      </div>
      <div className="brand-product-card__price">
        {Number(item?.sale_price || 0) > 0 ? (
          <>
            <strong>{Number(item.sale_price).toLocaleString("vi-VN")}đ</strong>
            <span>{Number(item.Price || 0).toLocaleString("vi-VN")}đ</span>
          </>
        ) : (
          <strong>{Number(item.Price || 0).toLocaleString("vi-VN")}đ</strong>
        )}
      </div>
    </Link>
  );
}
