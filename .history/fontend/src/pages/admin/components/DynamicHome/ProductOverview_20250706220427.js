import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
    const { request } = useHttp();
    const [categories, setCategories] = useState([]);
    const [filterOpen, setFilterOpen] = useState(true); // Trạng thái mở/đóng bộ lọc bên trái
    const [showCategories, setShowCategories] = useState(false); // Trạng thái mở/đóng danh mục trên topbar

    // Load danh mục sản phẩm từ API khi component mount
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

    return (
        <div className="product-wrapper">
            {/* ---------- Topbar chứa danh mục ---------- */}
            <div className={`product-topbar ${showCategories ? "show" : ""}`}>
                {/* Nút mở danh mục: chỉ hiện khi đang ẩn danh mục */}
                {!showCategories && (
                    <button
                        className="toggle-button"
                        onClick={() => setShowCategories(true)}
                    >
                        {/* Icon mũi tên ➜ */}
                        Mở danh mục ➜
                    </button>
                )}

                {/* Các nút danh mục sản phẩm */}
                <div className="category-buttons">
                    {categories.map((category, index) => (
                        <button
                            key={category.CategoryID}
                            // Thêm animation delay để trượt lần lượt
                            style={{
                                transition: "all 0.4s ease",
                                transitionDelay: showCategories ? `${index * 0.1}s` : "0s",
                                transform: showCategories ? "translateX(0)" : "translateX(-20px)",
                                opacity: showCategories ? 1 : 0
                            }}
                        >
                            {category.CategoryName}
                        </button>
                    ))}

                    {/* Nút đóng danh mục: chỉ hiện khi danh mục đang mở */}
                    {showCategories && (
                        <button
                            className="close-button"
                            onClick={() => setShowCategories(false)}
                            style={{
                                transition: "all 0.4s ease",
                                transitionDelay: `${categories.length * 0.1}s`,
                                transform: showCategories ? "translateX(0)" : "translateX(-20px)",
                                opacity: showCategories ? 1 : 0
                            }}
                        >
                            ✖ Đóng
                        </button>
                    )}
                </div>
            </div>

            {/* ---------- Nội dung chính ---------- */}
            <div className="product-content">
                {/* Bộ lọc bên trái */}
                <div className={`product-left ${filterOpen ? "open" : "closed"}`}>
                    {/* Header bộ lọc: có nút toggle (icon ▲ ▼) */}
                    <div
                        className="filter-header"
                        onClick={() => setFilterOpen(!filterOpen)}
                    >
                        <p>Bộ lọc sản phẩm</p>
                        {/* Icon thay đổi khi đóng/mở */}
                        <span className="toggle-icon">{filterOpen ? "▲" : "▼"}</span>
                    </div>

                    {/* Nội dung lọc chỉ hiện khi mở */}
                    {filterOpen && (
                        <div className="filter-body">
                            <p>Đây là các tùy chọn lọc...</p>
                        </div>
                    )}
                </div>

                {/* Danh sách sản phẩm bên phải */}
                <div className="product-right">
                    <div>Danh sách sản phẩm</div>
                </div>
            </div>
        </div>
    );
};
