import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
    const { request } = useHttp();
    const [categories, setCategories] = useState([]);

    const [filterOpen, setFilterOpen] = useState(true);

    const [showCategories, setShowCategories] = useState(false);
    const [containerVisible, setContainerVisible] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await request("GET", `${API_BASE}/api/user/products/loadCategory`);
                setCategories(res.data);
            } catch (error) {
                console.error("Lỗi tải danh mục:", error.status, error.message);
            }
        };
        fetchCategories();
    }, [request]);

    // Mở danh mục
    const handleOpen = () => {
        setContainerVisible(true);
        // Chờ container hiển thị rồi mới setShowCategories để bắt đầu animation
        setTimeout(() => {
            setShowCategories(true);
        }, 50); // Một chút delay để container xuất hiện trước
    };

    // Đóng danh mục
    const handleCloseCategories = () => {
        setShowCategories(false);
        const totalTime = categories.length * 100 + 400;
        setTimeout(() => {
            setContainerVisible(false);
        }, totalTime);
    };

    const isActive = showCategories;

    return (
        <div className="product-wrapper">
            <div className={`product-topbar ${isActive ? "show" : ""}`}>
                {!containerVisible && (
                    <button className="toggle-button" onClick={handleOpen}>
                        Mở danh mục ➜
                    </button>
                )}

                {containerVisible && (
                    <div className="category-buttons">
                        {categories.map((category, index) => (
                            <button
                                key={category.CategoryID}
                                style={{
                                    transition: "all 0.4s ease",
                                    transitionDelay: showCategories
                                        ? `${index * 0.1}s`
                                        : `${(categories.length - index) * 0.1}s`,
                                    transform: showCategories ? "translateX(0)" : "translateX(-20px)",
                                    opacity: showCategories ? 1 : 0,
                                }}
                            >
                                {category.CategoryName}
                            </button>
                        ))}

                        {showCategories && (
                            <button
                                className="close-button"
                                onClick={handleCloseCategories}
                                style={{
                                    transition: "all 0.4s ease",
                                    transitionDelay: `${categories.length * 0.1}s`,
                                    transform: showCategories ? "translateX(0)" : "translateX(-20px)",
                                    opacity: showCategories ? 1 : 0,
                                }}
                            >
                                ✖ Đóng
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ---------- Nội dung ---------- */}
            <div className="product-content">
                <div className={`product-left ${filterOpen ? "open" : "closed"}`}>
                    <div className="filter-header" onClick={() => setFilterOpen(!filterOpen)}>
                        <p>Bộ lọc sản phẩm</p>
                        <span className="toggle-icon">{filterOpen ? "▲" : "▼"}</span>
                    </div>
                    {filterOpen && (
                        <div className="filter-body">
                            <p>Đây là các tùy chọn lọc...</p>
                        </div>
                    )}
                </div>

                <div className="product-right">
                    <div>Danh sách sản phẩm</div>
                </div>
            </div>
        </div>
    );
};
