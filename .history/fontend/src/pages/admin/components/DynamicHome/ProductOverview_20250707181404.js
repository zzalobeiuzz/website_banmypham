import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
    const { request } = useHttp();
    const [categories, setCategories] = useState([]);

    // 📂 Trạng thái bộ lọc bên trái (filter)
    const [filterOpen, setFilterOpen] = useState(true);

    // 📁 Trạng thái animation danh mục topbar
    const [showCategories, setShowCategories] = useState(true);
    const [containerVisible, setContainerVisible] = useState(true); // Hiển thị container chứa button

    // 🚀 Lấy danh mục từ API khi mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await request(
                    "GET",
                    `${API_BASE}/api/user/products/loadCategory`
                );
                setCategories(res.data);
            } catch (error) {
                console.error("Lỗi tải danh mục:", error.status, error.message);
            }
        };
        fetchCategories();
    }, [request]);

    // 👉 Hàm mở danh mục
    const handleOpen = () => {
        setContainerVisible(true); // Hiển thị container trước
        setTimeout(() => {
            setShowCategories(true); // Sau 50ms bắt đầu animation
        }, 50);
    };

    // 👉 Hàm đóng danh mục
    const handleCloseCategories = () => {
        setShowCategories(false); // Bắt đầu animation đóng
        const totalTime = categories.length * 100 + 400; // Tổng thời gian delay animation

        setTimeout(() => {
            setContainerVisible(false); // Ẩn container sau animation
        }, totalTime);
    };

    // 🟢 Xác định đang active (đang mở animation)
    const isActive = showCategories;

    return (
        <div className="product-wrapper">
            {/* 🌟 Topbar chứa danh mục */}
            <div className={`product-topbar ${isActive ? "show" : ""}`}>
                {/* 🔥 Nút mở danh mục, chỉ hiện khi container đã đóng hoàn toàn */}
                {!containerVisible && (
                    <button className="toggle-button" onClick={handleOpen}>
                        Mở danh mục ➜
                    </button>
                )}

                {/* 💥 Container chứa các button danh mục */}
                {containerVisible && (
                    <div className="category-buttons">
                        {categories.map((category, index) => (
                            <button
                                key={category.CategoryID}
                                style={{
                                    // 🌈 Animation button: trượt vào từ trái, delay dần
                                    transition: "all 0.4s ease",
                                    transitionDelay: showCategories
                                        ? `${index * 0.1}s`
                                        : `${(categories.length - index) * 0.1}s`,
                                    transform: showCategories
                                        ? "translateX(0)"
                                        : "translateX(-20px)",
                                    opacity: showCategories ? 1 : 0,
                                }}
                            >
                                {category.CategoryName}
                            </button>
                        ))}

                        {/* ❌ Nút đóng danh mục, chỉ hiện khi đang mở */}
                        {showCategories && (
                            <button
                                className="close-button"
                                onClick={handleCloseCategories}
                                style={{
                                    transition: "all 0.4s ease",
                                    transitionDelay: `${categories.length * 0.1}s`,
                                    transform: showCategories
                                        ? "translateX(0)"
                                        : "translateX(-20px)",
                                    opacity: showCategories ? 1 : 0,
                                }}
                            >
                                ✖ Đóng
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 🗂 Khu vực nội dung chính */}
            <div className="product-content">
                {/* 🧩 Bộ lọc bên trái */}
                <div className={`product-left ${filterOpen ? "open" : "closed"}`}>
                    <div className="filter-header" onClick={() => setFilterOpen(!filterOpen)}>
                        {filterOpen && <p>Bộ lọc sản phẩm</p>}
                        <span
                            className="toggle-icon"
                            style={{ cursor: "pointer" }}
                        >
                            {!filterOpen ? (
                                <img
                                    src="/assets/icons/icons8-filter.gif"
                                    alt="filter icon"
                                
                                />
                            ) : (
                                "✖"
                            )}
                        </span>
                    </div>

                    {/* Chỉ hiển thị filter-body khi mở */}
                    {filterOpen && (
                        <div className="filter-body">
                            <p>Đây là các tùy chọn lọc...</p>
                        </div>
                    )}
                </div>


                {/* 🛒 Danh sách sản phẩm bên phải */}
                <div className="product-right">
                    <div>Danh sách sản phẩm</div>
                </div>
            </div>
        </div>
    );
};
