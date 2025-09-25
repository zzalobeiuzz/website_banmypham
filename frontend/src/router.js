import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.js";
import SignUp from "./components/signup.js";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.js";

// User
import HomePage from "./pages/user/homePage/home_page.js";
import ProfilePage from "./pages/user/profilePage/profile_page.js";
import MasterLayout from "./pages/user/theme/masterLayout/masterLayout.js";

// Admin
import AddProduct from "./pages/admin/components/DynamicHome/product/AddProduct.js";
import { ProductOverview } from "./pages/admin/components/DynamicHome/product/ProductOverview.js";
import AdminHomepage from "./pages/admin/homepage/homepage.js";
import AdminMasterLayout from "./pages/admin/theme/masterLayout.js";
import ProductDetail from "./pages/admin/components/DynamicHome/product/DetailProduct.js";
import OrderPage from "./pages/admin/components/DynamicHome/order/OrderPage.js";
import AddOrder from "./pages/admin/components/DynamicHome/order/AddOrder.js";
import OrderDetail from "./pages/admin/components/DynamicHome/order/OrderDetail.js";

import { ROUTERS } from "./utils/router";

// Cấu hình các route user
const userRoutes = [
  { path: ROUTERS.USER.HOME, element: <HomePage />, showHeaderFooter: true },
  { path: ROUTERS.USER.PROFILE, element: <ProfilePage />, showHeaderFooter: true },
  { path: ROUTERS.USER.SIGNUP, element: <SignUp />, showHeaderFooter: false },
];

// Cấu hình các route admin
const adminRoutes = [
  { path: ROUTERS.ADMIN.PRODUCT.INDEX, element: <ProductOverview /> },
  { path: ROUTERS.ADMIN.PRODUCT.ADD, element: <AddProduct /> },
  { path: ROUTERS.ADMIN.PRODUCT.DETAIL, element: <ProductDetail /> },
  // Nếu có component cho EDIT thì thêm:
  // { path: ROUTERS.ADMIN.PRODUCT.EDIT, element: <EditProduct /> },
  { path: ROUTERS.ADMIN.ORDER.INDEX, element: <OrderPage /> },
  { path: ROUTERS.ADMIN.ORDER.ADD, element: <AddOrder /> },
  { path: ROUTERS.ADMIN.ORDER.DETAIL, element: <OrderDetail /> },
  // Thêm các route admin khác ở đây nếu cần
];

const RouterCustom = () => (
  <Routes>
    {/* User routes */}
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

    {/* Admin routes */}
    <Route
      path={ROUTERS.ADMIN.HOME}
      element={
        <ProtectedRoute requiredRole={1}>
          <AdminMasterLayout />
        </ProtectedRoute>
      }
    >
      <Route element={<AdminHomepage />}>
        <Route index element={<ProductOverview />} />
        {adminRoutes.map((route, idx) => (
          <Route key={idx} path={route.path} element={route.element} />
        ))}
      </Route>
    </Route>

    {/* Not found */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default RouterCustom;
