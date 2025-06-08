import React from "react";
import "./style.scss"; // Đừng quên dòng này

const Homepage = () => {
  return (
    <div className="row h-100 homepage">
      <div className="col-2 bg-success">
        <div className="btn_top">
          <ul>
            <li>
              <button>
                <img src="./assets/icons/icons8-home-50.png" alt="" />
                <span>Trang chủ</span>
              </button>
            </li>
          </ul>
        </div>
        <div className="btn_mid">
          <div className="line">
            <span>Quản lý</span>
          </div>
          <ul>
            <li>
              <button>
                <img src="./assets/icons/icons8-home-50.png" alt="" />
                <span>Sản phẩm</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="col-10">{/* Nội dung bên phải */}</div>
    </div>
  );
};

export default Homepage;
