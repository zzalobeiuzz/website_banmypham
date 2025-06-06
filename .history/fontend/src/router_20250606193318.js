import { Route, Routes } from 'react-router-dom';
import SignUp from './components/signup.js';
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.js";
import AdminHomePage from "./pages/admin/homepage/homepage.js";
import AdminMasterLayout from './pages/admin/masterLayout.js';
import HomePage from "./pages/user/homePage/home_page.js";
import ProfilePage from "./pages/user/profilePage/profile_page.js";
import MasterLayout from './pages/user/theme/masterLayout/masterLayout.js';
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
    const adminRouters = [
        {
            path: ROUTERS.ADMIN.HOME,
            component: <AdminHomePage />,
        },
    ];

    return adminRouters.map((item, key) => (
        <Route
            key={key}
            path={item.path}
            element={
                <AdminMasterLayout>
                    {item.component}
                </AdminMasterLayout>
            }
        />
    ));
};

const RouterCustom = () => {
    return (
        <Routes>
         {/* Chuyển hướng trang gốc "/" sang "/admin" */}
         <Route path="/" element={<Navigate to="/admin" />} />
            {renderUserRouter()}
            {renderAdminRouter()}
            {/* Route not found - nên đặt cuối cùng */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default RouterCustom;