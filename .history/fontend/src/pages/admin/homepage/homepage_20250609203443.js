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
        <div className="manage">
          <div className="line">
            <button className="line-content">
              <span className="label">Quản lý</span>
              <img src="./assets/icons/icons-arrow-down.png" alt=""/>
            </button>
          </div>
          <ul>
            <li>
              <button>
                <img src="./assets/icons/icons-product-management.png" alt="" />
                <span>Sản phẩm</span>
              </button>
            </li>
            <li>
              <button>
                <img src="./assets/icons/icons-product-category.png" alt="" />
                <span>Danh mục sản phẩm</span>
              </button>
            </li>
            <li>
              <button>
                <img src="./assets/icons/icons-shipment.png" alt="" />
                <span>Lô hàng</span>
              </button>
            </li>
            <li>
              <button>
                <img src="./assets/icons/icons-customer.png" alt="" />
                <span>Khách hàng</span>
              </button>
            </li>
            <li>
              <button>
                <img src="./assets/icons/icons-account.png" alt="" />
                <span>Tài khoản</span>
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
