import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
    const { request } = useHttp();
    const [categories, setCategories] = useState([]);

    // Trạng thái bộ lọc bên trái
    const [filterOpen, setFilterOpen] = useState(true);

    // Trạng thái danh mục topbar
    const [showCategories, setShowCategories] = useState(false);

    // Trạng thái animation đóng (để delay trước khi biến mất)
    const [isAnimatingClose, setIsAnimatingClose] = useState(false);

    // Load danh mục từ API
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

    // Xử lý đóng danh mục
    const handleCloseCategories = () => {
        setIsAnimatingClose(true); // Bắt đầu animation

        const totalTime = categories.length * 100 + 400; // Tổng thời gian animation

        setTimeout(() => {
            setShowCategories(false); // Ẩn danh mục sau animation
            setIsAnimatingClose(false); // Reset flag animation
        }, totalTime);
    };

    // Check đang active (đang show hoặc đang animate đóng)
    const isActive = showCategories || isAnimatingClose;

    return (
        <div className="product-wrapper">
            {/* ---------- Topbar ---------- */}
            <div className={`product-topbar ${isActive ? "show" : ""}`}>
                {/* Nút mở danh mục: chỉ hiện khi đang đóng hoàn toàn */}
                {!showCategories && !isAnimatingClose && (
                    <button
                        className="toggle-button"
                        onClick={() => setShowCategories(true)}
                    >
                        Mở danh mục ➜
                    </button>
                )}

                {/* Các button danh mục */}
                <div className="category-buttons">
                    {categories.map((category, index) => (
                        <button
                            key={category.CategoryID}
                            style={{
                                transition: "all 0.4s ease",
                                transitionDelay: isActive
                                    ? `${index * 0.1}s`
                                    : `${(categories.length - index) * 0.1}s`,
                                transform: isActive ? "translateX(0)" : "translateX(-20px)",
                                opacity: isActive ? 1 : 0,
                            }}
                        >
                            {category.CategoryName}
                        </button>
                    ))}

                    {/* Nút đóng */}
                    {showCategories && (
                        <button
                            className="close-button"
                            onClick={handleCloseCategories}
                            style={{
                                transition: "all 0.4s ease",
                                transitionDelay: `${categories.length * 0.1}s`,
                                transform: isActive ? "translateX(0)" : "translateX(-20px)",
                                opacity: isActive ? 1 : 0,
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
                    <div
                        className="filter-header"
                        onClick={() => setFilterOpen(!filterOpen)}
                    >
                        <p>Bộ lọc sản phẩm</p>
                        <span className="toggle-icon">{filterOpen ? "▲" : "▼"}</span>
                    </div>

                    {/* Nội dung lọc (hiện khi mở) */}
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
