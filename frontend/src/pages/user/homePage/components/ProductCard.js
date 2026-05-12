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
  const { addToCart, cartItems } = useCart(); // ✅ dùng context

  // 📦 Số lượng tồn kho hiển thị ngay trên thẻ sản phẩm
  const stockQuantity = Number(
    item?.StockQuantity ?? 0
  );

  // 🛒 Trừ đi số lượng đã có trong giỏ để ra số còn thực sự có thể thêm
  const cartQuantity = cartItems.reduce((sum, cartItem) => {
    return String(cartItem?.productId) === String(item?.ProductID || item?.id)
      ? sum + Number(cartItem?.quantity || 0)
      : sum;
  }, 0);

  // 📦 Số lượng còn lại khi đã trừ kho 
  // gốc - giỏ
  const availableQuantity = Math.max(stockQuantity - cartQuantity, 0);


  // 👉 xử lý thêm vào giỏ hàng
  const handleAddToCart = (event, product) => {
    // Chặn sự kiện click lan ra Link cha, tránh redirect khi bấm nút thêm vào giỏ
    event.preventDefault();
    event.stopPropagation();

    // 📦 Lấy số lượng tồn kho hiện tại để chặn thêm vượt kho
    const productId = product.ProductID || product.id;

    if (availableQuantity <= 0) {
      window.alert("Không thể thêm vào giỏ. Sản phẩm đã hết hàng.");
      return;
    }

    // ✨ Hiệu ứng bay vào giỏ hàng (chỉ khi còn hàng)
    const productImage = event.currentTarget
      .closest(".brand-product-link")
      ?.querySelector("img");

    if (productImage) {
      flyToCart(productImage);
    }

    // ✅ Gửi kèm số lượng tồn kho GỐC (từ server) để CartContext kiểm tra trước khi thêm
    const added = addToCart(productId, 1, stockQuantity);
    if (!added) {
      window.alert(`Chỉ còn ${availableQuantity} sản phẩm trong kho.`);
    }
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

        <div className="product-card__footer">
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

          <div className={`product-card__stock ${stockQuantity <= 0 ? "is-out" : "is-available"}`}>
            <span>
              {stockQuantity > 0
                ? `Tồn kho: ${stockQuantity}`
                : "Hết hàng"}
            </span>
          </div>
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
