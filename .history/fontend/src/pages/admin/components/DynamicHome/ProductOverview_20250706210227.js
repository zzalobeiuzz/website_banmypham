import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
    const { request } = useHttp();
    const [categories, setCategories] = useState([]);
    const [filterOpen, setFilterOpen] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await request("GET", `${API_BASE}/api/user/products/loadCategory`);
                setCategories(res.data);
            } catch (error) {
                console.error("Lỗi tải danh mục:", error.me);
            }
        };

        fetchCategories();
    }, [request]);

    return (
        <div className="product-wrapper">
            {/* Topbar nằm trong wrapper */}
            <div className="product-topbar">
                <button>Tất cả</button>
                {categories.map((category) => (
                    <button key={category.CategoryID}>{category.CategoryName}</button>
                ))}
            </div>

            <div className="product-content">
                <div
                    className={`product-left ${filterOpen ? "open" : "closed"}`}
                >
                    <div className="filter-header" onClick={() => setFilterOpen(!filterOpen)}>
                        <p>Bộ lọc sản phẩm</p>
                        <span className="toggle-icon">{filterOpen ? "▲" : "▼"}</span>
                    </div>
                    {filterOpen && (
                        <div className="filter-body">
                            {/* Nội dung bộ lọc ở đây */}
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
