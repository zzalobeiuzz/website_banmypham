import "@fortawesome/fontawesome-free/css/all.min.css";
import React from "react";
import ReactDOM from "react-dom/client";
import "react-quill/dist/quill.snow.css";
import { BrowserRouter } from "react-router-dom";

import RouterCustom from "./router";
import GlobalAlertPopup, {
  installGlobalAlertPopup,
} from "./components/GlobalAlertPopup";

import { CartProvider } from "./pages/user/context/CartContext";
import { AuthProvider } from "./pages/user/context/AuthContext"; // ✅ THÊM

import "./styles/style.scss";

installGlobalAlertPopup();

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    {/* 🔐 AUTH TOÀN APP */}
    <AuthProvider>
      {/* 🛒 CART TOÀN APP */}
      <CartProvider>
        <RouterCustom />
        <GlobalAlertPopup />
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);