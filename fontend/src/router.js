import { Route, Routes } from 'react-router-dom';
import HomePage from "./pages/user/homePage/home_page.js";
import ProfilePage from "./pages/user/profilePage/profile_page.js";
import MasterLayout from './pages/user/theme/masterLayout/masterLayout.js';
import { ROUTERS } from "./utils/router";


const renderUserRouter = () => {
    // Định nghĩa một mảng các routes với đường dẫn và thành phần tương ứng
    const userRouters = [
        {
            path: ROUTERS.USER.HOME,   // Đường dẫn của route, giá trị này đến từ một đối tượng ROUTERS.USER
            component: <HomePage />    // Thành phần sẽ được render khi người dùng truy cập vào đường dẫn này
        },
        {
            path: ROUTERS.USER.PROFILE,   // Đường dẫn của route, giá trị này đến từ một đối tượng ROUTERS.USER
            component: <ProfilePage />    // Thành phần sẽ được render khi người dùng truy cập vào đường dẫn này
        }
    ];

    // Trả về thành phần Routes bao quanh các Route được tạo ra từ mảng userRouters
    return (
        <MasterLayout>
            <Routes>
                {
                    // Duyệt qua mỗi phần tử trong mảng userRouters và tạo một Route tương ứng
                    userRouters.map((item, key) => {
                        return (
                            <Route
                                key={key}                // Khóa duy nhất cho mỗi Route, giúp React tối ưu hóa quá trình render
                                path={item.path}         // Đường dẫn được gán vào Route
                                element={item.component} // Thành phần được render khi đường dẫn khớp với URL
                            />
                        );
                    })
                }
            </Routes>
        </MasterLayout>
    );
};



const RouterCustom = () => {
    return renderUserRouter();
};
export default RouterCustom;