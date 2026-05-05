import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./ProductCard.scss";
import { flyToCart } from "../components/FlyToCart";
import { useCart } from "../../context/CartContext";

/**
 * ProductCard - Card sản phẩm dùng chung
 */

export default function ProductCard({
  item,
  detailUrl,
  resolveProductImage,
  cardIndex,
}) {
  const location = useLocation();
  const { addToCart } = useCart(); // ✅ dùng context

  // 👉 xử lý thêm vào giỏ hàng
  // const handleAddToCart = (event, product) => {
  //   event.preventDefault();
  //   event.stopPropagation();

  //   // 🔥 hiệu ứng bay vào giỏ
  //   const productImage = event.currentTarget
  //     .closest(".brand-product-link")
  //     ?.querySelector("img");

  //   if (productImage) {
  //     flyToCart(productImage);
  //   }

  //   // 🔥 add vào cart context
  //   addToCart({
  //     id: product.ProductID || product.id,
  //     name: product.ProductName,
  //     price: product.Price,
  //     sale_price: product.sale_price,
  //     image: product.Image,
  //   });
  // };
  const handleAddToCart = (event, product) => {
    event.preventDefault();
    event.stopPropagation();

    const productImage = event.currentTarget
      .closest(".brand-product-link")
      ?.querySelector("img");

    if (productImage) {
      flyToCart(productImage);
    }

    // ✅ CHỈ gửi ID + quantity
    addToCart(product.ProductID || product.id, 1);
  };
  return (
    <div className="product-card" style={{ "--card-index": cardIndex }}>
      <Link
        to={detailUrl}
        state={{ from: location.pathname }}
        className="brand-product-link"
        style={{ display: "block", position: "relative" }}
      >
        <img
          src={resolveProductImage(item.Image)}
          alt={item.ProductName || "product"}
          loading="lazy"
        />

        <div className="product-card__code">
          Mã:{" "}
          {String(
            item?.ProductCode ||
              item?.code ||
              item?.product_code ||
              item?.ProductID ||
              "",
          )}
        </div>

        <div className="product-card__name" title={item.ProductName}>
          {item.ProductName}
        </div>

        <div className="product-card__price">
          {Number(item?.sale_price || 0) > 0 ? (
            <>
              <strong>
                {Number(item.sale_price).toLocaleString("vi-VN")}đ
              </strong>
              <span>{Number(item.Price || 0).toLocaleString("vi-VN")}đ</span>
            </>
          ) : (
            <strong>{Number(item.Price || 0).toLocaleString("vi-VN")}đ</strong>
          )}
        </div>

        {/* 👉 button add cart */}
        <button
          className="add-cart-plus-btn"
          title="Thêm vào giỏ hàng"
          style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}
          onClick={(e) => handleAddToCart(e, item)}
        >
          <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
            +
          </span>
        </button>
      </Link>
    </div>
  );
}
