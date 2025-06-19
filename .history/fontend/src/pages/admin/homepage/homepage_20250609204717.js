import React from "react";
import "./style.scss"; // Đừng quên dòng này

const Homepage = () => {
  const managementItems = [
    {
      icon: "./assets/icons/icons-product-management.png",
      label: "Sản phẩm",
    },
    {
      icon: "./assets/icons/icons-product-category.png",
      label: "Danh mục sản phẩm",
    },
    {
      icon: "./assets/icons/icons-shipment.png",
      label: "Lô hàng",
    },
    {
      icon: "./assets/icons/icons-customer.png",
      label: "Khách hàng",
    },
    {
      icon: "./assets/icons/icons-account.png",
      label: "Tài khoản",
    },
  ];

  const eventItems = [
    {
      icon: "./assets/icons/icons-event.png",
      label: "Sự kiện giảm giá",
    },
    {
      icon: "./assets/icons/icons-hot-price.png",
      label: "Sản phẩm hot",
    },
    {
      icon: "./assets/icons/icons-sale.png",
      label: "Sản phẩm giảm giá",
    },
  ];

  const revenueItems = [
    {
      icon: "./assets/icons/icons-event.png",
      label: "Tổng quan",
    },
    {
      
    }
  ]
  const renderMenu = (items) => (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          <button>
            <img src={item.icon} alt="" />
            <span>{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );

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
        <div className="btn_manage">
          <div className="line">
            <button className="line-content">
              <span className="label">Quản lý</span>
              <img src="./assets/icons/icons-arrow-down.png" alt="" />
            </button>
          </div>
          {renderMenu(managementItems)}
        </div>
        <div className="btn_event">
          <div className="line">
            <button className="line-content">
              <span className="label">Quản lý sự kiện</span>
              <img src="./assets/icons/icons-arrow-down.png" alt="" />
            </button>
          </div>
          {renderMenu(eventItems)}
        </div>
      </div>
      <div className="col-10">{/* Nội dung bên phải */}</div>
    </div>
  );
};

export default Homepage;
