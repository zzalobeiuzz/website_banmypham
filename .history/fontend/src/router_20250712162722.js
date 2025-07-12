import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.js";
import SignUp from "./components/signup.js";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.js";

// User
import HomePage from "./pages/user/homePage/home_page.js";
import ProfilePage from "./pages/user/profilePage/profile_page.js";
import MasterLayout from "./pages/user/theme/masterLayout/masterLayout.js";

// Admin
import AddProduct from "../src/pages/admin/components/DynamicHome/product/AddProduct.js";
import { ProductOverview } from "./pages/admin/components/DynamicHome/product/ProductOverview.js";
import AdminMasterLayout from "./pages/admin/theme/masterLayout.js";

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
      path={ROUTERS.ADMIN.HOME} // "/admin"
      element={
        <ProtectedRoute requiredRole={1}>
          <AdminMasterLayout />
          
        </ProtectedRoute>
      }
    >
      {/* Mặc định khi vào /admin, chuyển đến /admin/product */}
      <Route index element={<Navigate to={ROUTERS.ADMIN.PRODUCT.INDEX} replace />} />

      {/* /admin/product */}
      <Route path={ROUTERS.ADMIN.PRODUCT.INDEX} element={<ProductOverview />}>
        {/* Index = danh sách sản phẩm mặc định */}
        <Route index element={<div>Danh sách sản phẩm (index)</div>} />

        {/* /admin/product/add */}
        <Route path="add" element={<AddProduct />} />

        {/* /admin/product/edit/:id */}
        <Route path="edit/:id" element={<div>Chỉnh sửa sản phẩm</div>} />

        {/* /admin/product/detail/:id */}
        <Route path="detail/:id" element={<div>Chi tiết sản phẩm</div>} />
      </Route>

      {/* Các module khác (ví dụ order, account...) có thể tiếp tục thêm ở đây */}
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
