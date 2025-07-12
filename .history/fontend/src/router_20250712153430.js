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
import SignUp from "./components/signup.js";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.js";
import { ProductOverview } from "./pages/admin/components/DynamicHome/ProductOverview.js";
import AdminHomePage from "./pages/admin/homepage/homepage.js";
import AdminMasterLayout from "./pages/admin/theme/masterLayout.js";
import HomePage from "./pages/user/homePage/home_page.js";
import ProfilePage from "./pages/user/profilePage/profile_page.js";
import MasterLayout from "./pages/user/theme/masterLayout/masterLayout.js";


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
        {/* /admin (trang chính admin) */}
        <Route index element={<AdminHomePage />} />
  
        {/* /admin/product */}
        <Route path={ROUTERS.ADMIN.PRODUCT.INDEX} element={<ProductOverview />}>
          <Route index element={<ProductPage />} />         {/* /admin/product */}
        //   <Route path="add" element={<AddProduct />} />     {/* /admin/product/add */}
        //   <Route path="edit/:id" element={<EditProduct />} /> {/* /admin/product/edit/:id */}
        </Route>
  
        {/* /admin/order */}
        <Route path={ROUTERS.ADMIN.ORDER.INDEX} element={<OrderOverview />}>
          <Route index element={<OrderPage />} />           {/* /admin/order */}
          <Route path="add" element={<AddOrder />} />       {/* /admin/order/add */}
          <Route path="edit/:id" element={<EditOrder />} /> {/* /admin/order/edit/:id */}
        </Route>
  
        {/* /admin/account */}
        <Route path={ROUTERS.ADMIN.ACCOUNT.INDEX} element={<AccountOverview />}>
          <Route index element={<AccountPage />} />             {/* /admin/account */}
          <Route path="add" element={<AddAccount />} />         {/* /admin/account/add */}
          <Route path="edit/:id" element={<EditAccount />} />   {/* /admin/account/edit/:id */}
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
