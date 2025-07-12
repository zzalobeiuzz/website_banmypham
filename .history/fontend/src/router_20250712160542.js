import { Route, Routes, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.js";
import SignUp from "./components/signup.js";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.js";

// User
import HomePage from "./pages/user/homePage/home_page.js";
import ProfilePage from "./pages/user/profilePage/profile_page.js";
import MasterLayout from "./pages/user/theme/masterLayout/masterLayout.js";

// Admin
import { ProductOverview } from "./pages/admin/components/DynamicHome/product/ProductOverview.js";
import AdminHomePage from "./pages/admin/homepage/homepage.js";
import AdminMasterLayout from "./pages/admin/theme/masterLayout.js";
import AddProduct from "./"; // Nếu có


import { ROUTERS } from "./utils/router";

const renderUserRouter = () => {
  const userRouters = [
    {
      path: ROUTERS.USER.HOME,
      component: <HomePage />,
      isShowHeader_Footer: true,
    },
    {
      path: ROUTERS.USER.PROFILE,
      component: <ProfilePage />,
      isShowHeader_Footer: true,
    },
    {
      path: ROUTERS.USER.SIGNUP,
      component: <SignUp />,
      isShowHeader_Footer: false,
    },
  ];

  return userRouters.map((item, key) => (
    <Route
      key={key}
      path={item.path}
      element={
        <MasterLayout showHeaderFooter={item.isShowHeader_Footer}>
          {item.component}
        </MasterLayout>
      }
    />
  ));
};

const renderAdminRouter = () => {
  return (
    <Route
      path={ROUTERS.ADMIN.HOME} // /admin
      element={
        <ProtectedRoute requiredRole={1}>
          <AdminMasterLayout />
        </ProtectedRoute>
      }
    >
      {/* ✅ Khi vào /admin mặc định redirect qua /admin/product */}
      <Route index element={<Navigate to={ROUTERS.ADMIN.PRODUCT.INDEX} replace />} />

      {/* /admin/product */}
      <Route path={ROUTERS.ADMIN.PRODUCT.INDEX} element={<ProductOverview />}>
        {/* /admin/product/add */}
        <Route path="add" element={<AddProduct />} />

        {/* /admin/product/edit/:id */}
        <Route path="edit/:id" element={<EditProduct />} />
      </Route>

      {/* Nếu muốn thêm các module khác ví dụ order, account... tiếp tục thêm ở đây */}
    </Route>
  );
};

const RouterCustom = () => {
  return (
    <Routes>
      {renderUserRouter()}
      {renderAdminRouter()}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default RouterCustom;
