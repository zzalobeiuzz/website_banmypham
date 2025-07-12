import React, { useEffect, useState, useMemo } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

const ProductOverview = ({ searchKeyword }) => {
    const { request } = useHttp();

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("Tất cả");

    const [filterOpen, setFilterOpen] = useState(false);
    const [showFilterContent, setShowFilterContent] = useState(false);
    const [showCategories, setShowCategories] = useState(true);
    const [containerVisible, setContainerVisible] = useState(true);
    const [showCloseButton, setShowCloseButton] = useState(true);

    const [selectMode, setSelectMode] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [editMode, setEditMode] = useState(false);

    // 🔥 Load dữ liệu
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoryRes, productRes] = await Promise.all([
                    request("GET", `${API_BASE}/api/user/products/loadCategory`),
                    request("GET", `${API_BASE}/api/user/products/loadAllProducts`),
                ]);
                setCategories(categoryRes.data);
                setProducts(productRes.data);
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            }
        };
        fetchData();
    }, [request]);

    // ✅ Lọc sản phẩm (tối ưu)
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchCategory =
                selectedCategory === "Tất cả" || product.CategoryName === selectedCategory;
            const matchKeyword =
                product.ProductName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                product.ProductID.toString().includes(searchKeyword.toLowerCase());
            return matchCategory && matchKeyword;
        });
    }, [products, selectedCategory, searchKeyword]);

    // Các hàm toggle
    const handleToggleSelectMode = () => {
        setSelectMode(!selectMode);
        setSelectedProducts([]);
        setEditMode(false);
    };

    const handleCheckboxChange = (productId) => {
        setSelectedProducts((prev) =>
            prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
        );
    };

    const handleEditOrSave = () => {
        if (editMode) {
            console.log("Lưu:", products.filter((p) => selectedProducts.includes(p.ProductID)));
            setEditMode(false);
            setSelectMode(false);
            setSelectedProducts([]);
        } else {
            if (!selectMode) return setSelectMode(true);
            if (selectedProducts.length === 0) return alert("Chọn ít nhất 1 sản phẩm!");
            setEditMode(true);
        }
    };

    const handleProductChange = (productId, field, value) => {
        setProducts((prev) =>
            prev.map((p) =>
                p.ProductID === productId ? { ...p, [field]: value } : p
            )
        );
    };

    return (
        <div className="product-wrapper">
            {/* Top bar danh mục */}
            <div className="product-topbar">
                {!containerVisible && (
                    <button onClick={() => {
                        setShowCloseButton(true);
                        setContainerVisible(true);
                        setTimeout(() => setShowCategories(true), 50);
                    }}>
                        Mở danh mục ➜
                    </button>
                )}

                {containerVisible && (
                    <div className="category-buttons">
                        <button onClick={() => setSelectedCategory("Tất cả")}>Tất cả</button>
                        {categories.map((cat) => (
                            <button
                                key={cat.CategoryID}
                                onClick={() => setSelectedCategory(cat.CategoryName)}
                            >
                                {cat.CategoryName}
                            </button>
                        ))}
                        {showCloseButton && (
                            <button
                                onClick={() => {
                                    setShowCloseButton(false);
                                    setShowCategories(false);
                                    setTimeout(() => setContainerVisible(false), categories.length * 100 + 400);
                                }}
                            >
                                ✖ Đóng
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Nội dung */}
            <div className={`product-content ${filterOpen ? "open" : ""}`}>
                <div className="product-left">
                    <button onClick={handleToggleSelectMode}>
                        {selectMode ? "Huỷ chọn" : "Chọn sản phẩm"}
                    </button>
                    <button onClick={handleEditOrSave}>
                        {editMode ? "Lưu" : "Chỉnh sửa"}
                    </button>
                    <button>Xóa</button>
                    <button>Xuất Excel</button>

                    <div onClick={() => {
                        if (!filterOpen) {
                            setFilterOpen(true);
                            setTimeout(() => setShowFilterContent(true), 300);
                        } else {
                            setShowFilterContent(false);
                            setFilterOpen(false);
                        }
                    }}>
                        {!filterOpen ? <>Mở bộ lọc</> : <>✖ Bộ lọc</>}
                    </div>

                    {showFilterContent && <div>Đây là filter...</div>}
                </div>

                <div className="product-right">
                    <ul>
                        {filteredProducts.map((p, idx) => (
                            <li key={p.ProductID}>
                                {selectMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.includes(p.ProductID)}
                                        onChange={() => handleCheckboxChange(p.ProductID)}
                                    />
                                )}
                                {idx + 1} - {p.ProductName}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ProductOverview);
