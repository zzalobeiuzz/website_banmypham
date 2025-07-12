// import { Route, Routes } from 'react-router-dom';
// import ProtectedRoute from './components/ProtectedRoute'; // ✅ thêm
// import SignUp from './components/signup.js';
// import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.js";
// import AdminHomePage from "./pages/admin/homepage/homepage.js";
// import AdminMasterLayout from './pages/admin/theme/masterLayout.js';
// import HomePage from "./pages/user/homePage/home_page.js";
// import ProfilePage from "./pages/user/profilePage/profile_page.js";
// import MasterLayout from './pages/user/theme/masterLayout/masterLayout.js';
// import { ROUTERS } from "./utils/router";

// const renderUserRouter = () => {
//     const userRouters = [
//         {
//             path: ROUTERS.USER.HOME,
//             component: <HomePage />,
//             isShowHeader_Footer: true,
//         },
//         {
//             path: ROUTERS.USER.PROFILE,
//             component: <ProfilePage />,
//             isShowHeader_Footer: true,
//         },
//         {
//             path: ROUTERS.USER.SIGNUP,
//             component: <SignUp />,
//             isShowHeader_Footer: false,
//         },
//     ];

//     return userRouters.map((item, key) => (
//         <Route
//             key={key}
//             path={item.path}
//             element={
//                 <MasterLayout showHeaderFooter={item.isShowHeader_Footer}>
//                     {item.component}
//                 </MasterLayout>
//             }
//         />
//     ));
// };

// const renderAdminRouter = () => {
//     const adminRouters = [
//         {
//             path: ROUTERS.ADMIN.HOME,
//             component: <AdminHomePage />,
//         },
//     ];

//     return adminRouters.map((item, key) => (
//         <Route
//             key={key}
//             path={item.path}
//             element={
//                 <ProtectedRoute requiredRole={1}>   {/* ✅ Bọc lại để kiểm tra quyền */}
//                     <AdminMasterLayout>
//                         {item.component}
//                     </AdminMasterLayout>
//                 </ProtectedRoute>
//             }
//         />
//     ));
// };

// const RouterCustom = () => {
//     return (
//         <Routes>
//             {renderUserRouter()}
//             {renderAdminRouter()}
//             <Route path="*" element={<NotFoundPage />} />
//         </Routes>
//     );
// };

// export default RouterCustom;
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.js";
import SignUp from "../";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.js";
import AdminHomePage from "./pages/admin/homepage/homepage.js";
import AdminMasterLayout from "./pages/admin/theme/masterLayout.js";
import HomePage from "./pages/user/homePage/home_page.js";
import ProfilePage from "./pages/user/profilePage/profile_page.js";
import MasterLayout from "./pages/user/theme/masterLayout/masterLayout.js";
import ProductOverview from "./pages/admin/product/overview";
import AddProduct from "./pages/admin/product/add";
import ProductDetail from "./pages/admin/product/detail";
import EditProduct from "./pages/admin/product/edit";
import OrderOverview from "./pages/admin/order/overview";
import AddOrder from "./pages/admin/order/add";
import OrderDetail from "./pages/admin/order/detail";
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
      {/* Trang chính admin: /admin */}
      <Route index element={<AdminHomePage />} />

      {/* Product */}
      <Route path={ROUTERS.ADMIN.PRODUCT.INDEX} element={<ProductOverview />} />
      <Route path={ROUTERS.ADMIN.PRODUCT.ADD} element={<AddProduct />} />
      <Route path={ROUTERS.ADMIN.PRODUCT.DETAIL} element={<ProductDetail />} />
      <Route path={ROUTERS.ADMIN.PRODUCT.EDIT} element={<EditProduct />} />

      {/* Order */}
      <Route path={ROUTERS.ADMIN.ORDER.INDEX} element={<OrderOverview />} />
      <Route path={ROUTERS.ADMIN.ORDER.ADD} element={<AddOrder />} />
      <Route path={ROUTERS.ADMIN.ORDER.DETAIL} element={<OrderDetail />} />
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
