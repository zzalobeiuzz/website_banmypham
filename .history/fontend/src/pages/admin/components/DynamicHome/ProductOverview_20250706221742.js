import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
    const { request } = useHttp();
    const [categories, setCategories] = useState([]);

    const [filterOpen, setFilterOpen] = useState(true);
    const [showCategories, setShowCategories] = useState(false);
    const [containerVisible, setContainerVisible] = useState(false); // điều khiển thực sự hide container

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

    const handleOpen = () => {
        setContainerVisible(true);
        setShowCategories(true);
    };

    const handleCloseCategories = () => {
        setShowCategories(false);

        // Tổng thời gian để các nút đóng hết
        const totalTime = categories.length * 100 + 400;
        setTimeout(() => {
            setContainerVisible(false); // hide container sau khi animation xong
        }, totalTime);
    };

    return (
        <div className="product-wrapper">
            <div className={`product-topbar ${showCategories ? "show" : ""}`}>
                {/* Nút mở */}
                {!containerVisible && (
                    <button className="toggle-button" onClick={handleOpen}>
                        Mở danh mục ➜
                    </button>
                )}

                {/* Các button danh mục */}
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
