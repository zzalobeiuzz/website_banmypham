import { Route, Routes } from 'react-router-dom';
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage.js";
import HomePage from "./pages/user/homePage/home_page.js";
import ProfilePage from "./pages/user/profilePage/profile_page.js";
import MasterLayout from './pages/user/theme/masterLayout/masterLayout.js';
import SignUp from './components/signup.js'
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
            path: ROUTERS.USER.PROFILE,
            component: <ProfilePage />,
            isShowHeader_Footer: true,
        },
        {
            path: ROUTERS.NOTFOUNDPAGE.NOTFOUNDPAGE,
            component: <NotFoundPage />,
            isShowHeader_Footer: false, // Ẩn header và footer cho trang NotFoundPage
        }
    ];

    return (
        <Routes>
            {
                userRouters.map((item, key) => (
                    <Route
                        key={key}
                        path={item.path}
                        element={
                            <MasterLayout showHeaderFooter={item.isShowHeader_Footer}>
                                {item.component}
                            </MasterLayout>
                        }
                    />
                )) 
            }
        </Routes>
    );
};

const RouterCustom = () => {
    return renderUserRouter();
};

export default RouterCustom;
