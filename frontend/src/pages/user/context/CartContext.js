//

import React, { createContext, useContext, useEffect, useState } from "react";

// 🛒 Tạo context giỏ hàng dùng toàn app
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // =========================
  // 📦 KIỂM TRA SỐ LƯỢNG TỒN KHO
  // =========================
  const getStockLimit = (value) => {
    const stock = Number(value);
    return Number.isFinite(stock) && stock >= 0 ? stock : null;
  };

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
  const addToCart = (productId, quantity = 1, stockQuantity = null) => {
    const stockLimit = getStockLimit(stockQuantity);
    const copy = [...cartItems];
    const index = copy.findIndex((i) => i.productId === productId);
    const currentQty = index >= 0 ? Number(copy[index].quantity || 0) : 0;
    const nextQty = currentQty + Number(quantity || 0);

    // 🚫 Chỉ chặn khi số lượng sau khi thêm vượt quá tồn kho
    if (stockLimit !== null && nextQty > stockLimit) {
      console.warn(`⚠️ Sản phẩm ${productId} chỉ còn ${stockLimit} trong kho, không thể thêm tới ${nextQty}.`);
      if (stockLimit <= 0) {
        return false;
      }
      return false;
    }

    if (index >= 0) {
      // ➕ nếu đã có thì tăng số lượng
      copy[index] = {
        ...copy[index],
        quantity: nextQty,
      };
    } else {
      // 🆕 chưa có thì thêm mới
      copy.push({ productId, quantity: Number(quantity || 0) });
    }

    saveCart(copy);
    return true;
  };

  // =========================
  // ⬆️ TĂNG SỐ LƯỢNG
  // =========================
  const increaseQty = (id, stockQuantity = null) => {
    const stockLimit = getStockLimit(stockQuantity);
    const copy = cartItems.map((i) =>
      i.productId === id
        ? { ...i, quantity: Number(i.quantity || 0) + 1 }
        : i
    );

    const targetItem = copy.find((i) => i.productId === id);

    // 🚫 Nếu vượt kho thì giữ nguyên giỏ hàng hiện tại
    if (stockLimit !== null && targetItem && targetItem.quantity > stockLimit) {
      console.warn(`⚠️ Sản phẩm ${id} chỉ còn ${stockLimit} trong kho, không thể tăng thêm.`);
      if (stockLimit <= 0) {
        return false;
      }
      return false;
    }

    saveCart(copy);
    return true;
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