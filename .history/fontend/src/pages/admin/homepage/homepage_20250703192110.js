import React, { useEffect, useRef, useState } from "react";
import "./style.scss";

const Homepage = () => {
  const managementItems = [
    { icon: "./assets/icons/icons-product-management.png", label: "Sản phẩm" },
    { icon: "./assets/icons/icons-event.png", label: "Đơn hàng" },
    { icon: "./assets/icons/icons-product-category.png", label: "Danh mục" },
    { icon: "./assets/icons/icons-shipment.png", label: "Lô hàng" },
    { icon: "./assets/icons/icons-customer.png", label: "Khách hàng" },
    { icon: "./assets/icons/icons-account.png", label: "Tài khoản" },
  ];

  const eventItems = [
    { icon: "./assets/icons/icons-event.png", label: "Sự kiện giảm giá" },
    { icon: "./assets/icons/icons-hot-price.png", label: "Sản phẩm hot" },
    { icon: "./assets/icons/icons-sale.png", label: "Sản phẩm sale" },
  ];

  const revenueItems = [
    { icon: "./assets/icons/icons-analytics.png", label: "Tổng quan" },
    { icon: "./assets/icons/icons-revenue.png", label: "Doanh thu" },
    {
      icon: "./assets/icons/icons-conversion-rate.png",
      label: "Tỷ lệ chuyển đổi",
    },
  ];

  // ✅ Check admin quyền khi load trang
  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "/";
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/admin", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Không phải admin hoặc token không hợp lệ");
        }

        console.log("✅ Admin verified!");
      } catch (error) {
        alert("Bạn không có quyền truy cập trang này!");
        window.location.href = "/";
      }
    };

    checkAdmin();
  }, []);

  const MenuSection = ({ title, items, className = "" }) => {
    co
