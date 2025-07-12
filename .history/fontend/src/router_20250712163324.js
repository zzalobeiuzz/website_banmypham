import { Route, Routes } from "react-router-dom";
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
        path={ROUTERS.ADMIN.HOME}
        element={
          <ProtectedRoute requiredRole={1}>
            <AdminMasterLayout />
          </ProtectedRoute>
        }
      >
        {/* Khi vào /admin, Outlet trong AdminMasterLayout sẽ render Homepage */}
        <Route element={<AdminHomepage />}>
          {/* Mặc định vào /admin, Outlet trong Homepage render ProductOverview */}
          <Route index element={<ProductOverview />} />
          
          {/* Các route con khác của admin */}
          <Route path="product" element={<ProductOverview />} />
          <Route path="product/add" element={<AddProduct />} />
          {/* ... tiếp tục thêm */}
        </Route>
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
