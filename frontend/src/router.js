import { Route, Routes, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.js";
import SignUp from "./components/signup.js";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.js";

// ========== 👤 USER IMPORTS ==========
import HomePage from "./pages/user/homePage/home_page.js";
import ProfilePage from "./pages/user/profilePage/profile_page.js";
import MasterLayout from "./pages/user/theme/masterLayout/masterLayout.js";

// ========== 🛠️ ADMIN IMPORTS ==========
import AddProduct from "./pages/admin/components/DynamicHome/product/AddProduct.js";
import { ProductOverview } from "./pages/admin/components/DynamicHome/product/ProductOverview.js";
import AdminHomepage from "./pages/admin/homepage/homepage.js";
import AdminMasterLayout from "./pages/admin/theme/masterLayout.js";
import ProductDetail from "./pages/admin/components/DynamicHome/product/DetailProduct.js";
import OrderPage from "./pages/admin/components/DynamicHome/order/OrderPage.js";
import AddOrder from "./pages/admin/components/DynamicHome/order/AddOrder.js";

import { ROUTERS } from "./utils/router";

// ========== 👤 USER ROUTES ==========
const userRoutes = [
  { path: ROUTERS.USER.HOME, element: <HomePage />, showHeaderFooter: true },
  { path: ROUTERS.USER.PROFILE, element: <ProfilePage />, showHeaderFooter: true },
  { path: ROUTERS.USER.SIGNUP, element: <SignUp />, showHeaderFooter: false },
];

// ========== 🛠️ ADMIN ROUTES ==========
const adminRoutes = [
  {
    path: ROUTERS.ADMIN.PRODUCT.INDEX || "product", // 📦 Sản phẩm
    children: [
      {
        path: ROUTERS.ADMIN.PRODUCT.ADD.replace("product/", ""), // ➕ Thêm sản phẩm (/admin/product/add)
        element: <AddProduct />,
      },
      {
        path: ROUTERS.ADMIN.PRODUCT.DETAIL.replace("product/", ""), // 🔍 Chi tiết sản phẩm (/admin/product/detail/:id)
        element: <ProductDetail />,
      },
    ],
  },
  {
    path: ROUTERS.ADMIN.ORDER.INDEX || "order", // 📦 Đơn hàng
    children: [
      { index: true, element: <OrderPage /> }, // 🏠 Trang danh sách đơn hàng (/admin/order)
      {
        path: ROUTERS.ADMIN.ORDER.ADD.replace("order/", ""), // ➕ Thêm đơn hàng (/admin/order/add)
        element: <AddOrder />,
      },
    ],
  },
];

// ========== 🚦 ROUTER CUSTOM ==========
const RouterCustom = () => (
  <Routes>
    {/* 👤 USER ROUTES */}
    {userRoutes.map((route, idx) => (
      <Route
        key={idx}
        path={route.path}
        element={
          <MasterLayout showHeaderFooter={route.showHeaderFooter}>
            {route.element}
          </MasterLayout>
        }
      />
    ))}

    {/* 🛠️ ADMIN ROUTES */}
    <Route
      path={ROUTERS.ADMIN.HOME}
      element={
        <ProtectedRoute requiredRole={1}>
          <AdminMasterLayout />
        </ProtectedRoute>
      }
    >
      {/* 🏠 Layout AdminHomepage bao ngoài (chứa sidebar, header, ...) */}
      <Route element={<AdminHomepage />}>
        {/* 🏠 Khi vào /admin → mặc định hiển thị ProductOverview */}
        <Route index element={<ProductOverview />} />

        {/* 📦 Các route con admin (sản phẩm, đơn hàng, ...) */}
        {adminRoutes.map((route, idx) => (
          <Route key={idx} path={route.path}>
            {route.children?.map((child, cidx) => (
              <Route
                key={cidx}
                index={child.index}
                path={child.path}
                element={child.element}
              />
            ))}
          </Route>
        ))}

        {/* 🚫 Redirect nếu không khớp path */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Route>

    {/* 🚫 NOT FOUND PAGE */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default RouterCustom;
