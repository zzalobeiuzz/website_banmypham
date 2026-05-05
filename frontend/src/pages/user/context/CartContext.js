//

import React, { createContext, useContext, useEffect, useState } from "react";

// 🛒 Tạo context giỏ hàng dùng toàn app
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // =========================
  // 📥 LOAD GIỎ HÀNG TỪ LOCALSTORAGE
  // =========================
  const loadCart = () => {
    try {
      const data = JSON.parse(localStorage.getItem("cartItems") || "[]");

      // 🧪 đảm bảo luôn là array hợp lệ
      setCartItems(Array.isArray(data) ? data : []);
    } catch {
      setCartItems([]);
    }
  };

  // =========================
  // 🚀 INIT + SYNC EVENT
  // =========================
  useEffect(() => {
    loadCart();

    // 🔄 đồng bộ khi tab khác thay đổi localStorage
    const handleStorage = () => loadCart();

    // 🔄 đồng bộ khi app dispatch event custom
    const handleCustom = () => loadCart();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("cart-updated", handleCustom);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cart-updated", handleCustom);
    };
  }, []);

  // =========================
  // 💾 LƯU GIỎ HÀNG + SYNC UI
  // =========================
  const saveCart = (data) => {
    // 💾 lưu xuống localStorage
    localStorage.setItem("cartItems", JSON.stringify(data));

    // 🔁 update state để UI re-render
    setCartItems([...data]);

    // 📡 bắn event để component khác biết giỏ hàng đổi
    window.dispatchEvent(new Event("cart-updated"));
  };

  // =========================
  // ➕ THÊM SẢN PHẨM VÀO GIỎ
  // =========================
  const addToCart = (productId, quantity = 1) => {
    setCartItems((prev) => {
      const copy = [...prev];

      const index = copy.findIndex((i) => i.productId === productId);

      if (index >= 0) {
        // ➕ nếu đã có thì tăng số lượng
        copy[index] = {
          ...copy[index],
          quantity: copy[index].quantity + quantity,
        };
      } else {
        // 🆕 chưa có thì thêm mới
        copy.push({ productId, quantity });
      }

      saveCart(copy);
      return copy;
    });
  };

  // =========================
  // ⬆️ TĂNG SỐ LƯỢNG
  // =========================
  const increaseQty = (id) => {
    setCartItems((prev) => {
      const copy = prev.map((i) =>
        i.productId === id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );

      saveCart(copy);
      return copy;
    });
  };

  // =========================
  // ⬇️ GIẢM SỐ LƯỢNG
  // =========================
  const decreaseQty = (id) => {
    setCartItems((prev) => {
      const copy = prev.map((i) =>
        i.productId === id && i.quantity > 1
          ? { ...i, quantity: i.quantity - 1 }
          : i
      );

      saveCart(copy);
      return copy;
    });
  };

  // =========================
  // ❌ XOÁ SẢN PHẨM
  // =========================
  const removeItem = (id) => {
    setCartItems((prev) => {
      const copy = prev.filter((i) => i.productId !== id);

      saveCart(copy);
      return copy;
    });
  };

  // =========================
  // 🗑️ XOÁ TOÀN BỘ GIỎ HÀNG
  // =========================
  const clearCart = () => {
    saveCart([]);
  };

  // =========================
  // 🧮 TỔNG SỐ LƯỢNG SP
  // =========================
  const cartCount = cartItems.reduce(
    (sum, i) => sum + i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,     // 📦 danh sách giỏ hàng
        addToCart,     // ➕ thêm sản phẩm
        increaseQty,   // ⬆️ tăng số lượng
        decreaseQty,   // ⬇️ giảm số lượng
        removeItem,    // ❌ xoá sản phẩm
        clearCart,     // 🗑️ xoá toàn bộ giỏ hàng
        cartCount,     // 🧮 tổng số lượng
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// 👉 custom hook dùng nhanh
export const useCart = () => useContext(CartContext);