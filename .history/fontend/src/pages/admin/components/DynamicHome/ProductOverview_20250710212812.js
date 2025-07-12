import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

// 💡 Component chính hiển thị danh sách sản phẩm
const ProductOverviewComponent  = ({ searchKeyword }) => {
    const { request } = useHttp();

    const [categories, setCategories] = useState([]);        // 🗂️ Lưu danh sách danh mục sản phẩm từ API
    const [products, setProducts] = useState([]);            // 📦 Lưu danh sách sản phẩm từ API
    const [selectedCategory, setSelectedCategory] = useState("Tất cả"); // 🔖 Danh mục đang được chọn

    // 🎛️ Các state điều khiển animation & hiển thị danh mục
    const [filterOpen, setFilterOpen] = useState(false);     // 🔄 Bật/tắt panel bộ lọc
    const [showFilterContent, setShowFilterContent] = useState(false); // 👁️ Hiện/ẩn nội dung bộ lọc
    const [showCategories, setShowCategories] = useState(true); // ✅ Hiện/ẩn danh sách danh mục
    const [containerVisible, setContainerVisible] = useState(true); // 📦 Hiện/ẩn container chứa danh mục
    const [showCloseButton, setShowCloseButton] = useState(true); // ✖️ Hiện/ẩn nút đóng danh mục

    // 🟢 Chế độ chọn và chỉnh sửa sản phẩm
    const [selectMode, setSelectMode] = useState(false);     // ✅ Bật/tắt chế độ chọn nhiều sản phẩm
    const [selectedProducts, setSelectedProducts] = useState([]); // ✔️ Danh sách ID sản phẩm được chọn
    const [editMode, setEditMode] = useState(false);         // ✏️ Bật/tắt chế độ chỉnh sửa sản phẩm

    // ⚡ Load dữ liệu danh mục & sản phẩm
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

    // 🔍 Lọc sản phẩm theo danh mục & từ khóa tìm kiếm (tối ưu với useMemo)
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            // ✅ Nếu chọn "Tất cả" hoặc đúng danh mục
            const matchCategory =
                selectedCategory === "Tất cả" || product.CategoryName === selectedCategory;

            // ✅ Tên chứa keyword (không phân biệt hoa thường) hoặc ID chứa keyword
            const matchKeyword =
                product.ProductName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                product.ProductID.toString().includes(searchKeyword.toLowerCase());

            // ✅ Trả về true nếu thoả cả danh mục và keyword
            return matchCategory && matchKeyword;
        });
    }, [products, selectedCategory, searchKeyword]);

    // 🔁 Mở danh mục
    const handleOpen = () => {
        
        setShowCloseButton(true);
        setContainerVisible(true);
        setTimeout(() => setShowCategories(true), 50);
    };

    // ❌ Đóng danh mục
    const handleCloseCategories = () => {
        setShowCloseButton(false);
        setShowCategories(false);
        const totalTime = categories.length * 100 + 400; // ⏳ Thời gian đóng (hiệu ứng)
        setTimeout(() => setContainerVisible(false), totalTime);
    };

    // 🔄 Toggle filter trái
    const handleToggleFilter = () => {
        if (!filterOpen) {
            setFilterOpen(true);
            setTimeout(() => setShowFilterContent(true), 300);
        } else {
            setShowFilterContent(false);
            setFilterOpen(false);
        }
    };

    // 🟢 Bật/tắt chế độ chọn nhiều
    const handleToggleSelectMode = () => {
        setSelectMode(!selectMode);
        setSelectedProducts([]);
        setEditMode(false); // Tắt edit nếu đang bật
    };

    // ✔️ Chọn/bỏ chọn sản phẩm
    const handleCheckboxChange = (productId) => {
        setSelectedProducts((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    // 💾 Xử lý lưu hoặc chuyển sang chế độ edit
    const handleEditOrSave = () => {
        if (editMode) {
            console.log("Lưu dữ liệu:", products.filter((p) => selectedProducts.includes(p.ProductID)));
            // TODO: Gọi API lưu sản phẩm ở đây nếu cần
            setEditMode(false);
            setSelectMode(false);
            setSelectedProducts([]);
        } else {
            if (!selectMode) {
                setSelectMode(true);
                return;
            }

            if (selectedProducts.length === 0) {
                alert("Vui lòng chọn ít nhất một sản phẩm trước khi chỉnh sửa.");
                return;
            }

            setEditMode(true);
        }
    };

    // ✏️ Cập nhật giá trị sản phẩm local state
    const handleProductChange = (productId, field, value) => {
        setProducts((prev) =>
            prev.map((product) =>
                product.ProductID === productId
                    ? { ...product, [field]: value }
                    : product
            )
        );
    };

    return (
        <div className="product-wrapper">
            {/* 🏷️ Thanh danh mục trên */}
            <div className="product-topbar">
                {!containerVisible && (
                    <button className="toggle-button" onClick={handleOpen}>
                        Mở danh mục ➜
                    </button>
                )}

                {containerVisible && (
                    <div className="category-buttons">
                        {/* Tất cả */}
                        <button
                            onClick={() => setSelectedCategory("Tất cả")}
                            style={{
                                transition: "all 0.4s ease",
                                transitionDelay: showCategories ? "0s" : `${categories.length * 0.1}s`,
                                transform: showCategories ? "translateX(0)" : "translateX(-20px)",
                                opacity: showCategories ? 1 : 0,
                            }}
                        >
                            Tất cả
                        </button>

                        {/* Các danh mục */}
                        {categories.map((category, index) => (
                            <button
                                key={category.CategoryID}
                                onClick={() => setSelectedCategory(category.CategoryName)}
                                style={{
                                    transition: "all 0.4s ease",
                                    transitionDelay: showCategories ? `${index * 0.1}s` : `${(categories.length - index) * 0.1}s`,
                                    transform: showCategories ? "translateX(0)" : "translateX(-20px)",
                                    opacity: showCategories ? 1 : 0,
                                }}
                            >
                                {category.CategoryName}
                            </button>
                        ))}

                        {/* Đóng */}
                        {showCloseButton && (
                            <button
                                className="close-button"
                                onClick={handleCloseCategories}
                                style={{
                                    transition: "all 0.4s ease",
                                    transitionDelay: showCategories ? `${categories.length * 0.1 + 0.1}s` : `${categories.length * 0.1 + 0.1}s`,
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

            {/* ====================== */}
            {/* Nội dung chính */}
            {/* ====================== */}
            <div className={`product-content ${filterOpen ? "open" : ""}`}>
                <div className="product-left">
                    {/* ⚙️ Các nút chức năng */}
                    <button onClick={handleToggleSelectMode}>
                        {selectMode ? "Huỷ chọn" : "Chọn sản phẩm"}
                    </button>
                    <button onClick={handleEditOrSave}>
                        {editMode ? "Lưu" : "Chỉnh sửa"}
                    </button>
                    <button>Xóa</button>
                    <button>Xuất Excel</button>

                    {/* Bộ lọc */}
                    <div className="filter-toggle-header" onClick={handleToggleFilter}>
                        {!filterOpen ? (
                            <>
                                <img
                                    src="/assets/icons/icons8-filter.gif"
                                    alt="filter icon"
                                    style={{ width: "24px", height: "24px" }}
                                />
                                <span>Mở bộ lọc</span>
                            </>
                        ) : (
                            <span>✖ Bộ lọc sản phẩm</span>
                        )}
                    </div>

                    {showFilterContent && (
                        <div className="filter-body">
                            <p>Đây là các tùy chọn lọc...</p>
                        </div>
                    )}
                </div>

                <div className="product-right">
                    <div className="content">
                        <div className="product-data">
                            {/* Header cột */}
                            <ul className="field-name list-unstyled">
                                <li className="field-col list-stt">STT</li>
                                <li className="field-col list-id">ID SP</li>
                                <li className="field-col list-name">Tên sản phẩm</li>
                                <li className="field-col list-image">Ảnh</li>
                                <li className="field-col list-price">Giá</li>
                                <li className="field-col list-category">Danh mục</li>
                                <li className="field-col list-stock">Tồn kho</li>
                            </ul>

                            {/* Danh sách sản phẩm */}
                            <div className="data">
                                {filteredProducts.map((product, index) => (
                                    <ul key={product.ProductID} className="list-unstyled row-data">
                                        <li className="list-stt">
                                            {selectMode && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProducts.includes(product.ProductID)}
                                                    onChange={() => handleCheckboxChange(product.ProductID)}
                                                />
                                            )}
                                            {index + 1}
                                        </li>
                                        <li className="list-id">{product.ProductID}</li>
                                        <li className="list-name">
                                            {editMode && selectedProducts.includes(product.ProductID) ? (
                                                <textarea
                                                    className="input-name"
                                                    value={product.ProductName}
                                                    onChange={(e) =>
                                                        handleProductChange(product.ProductID, "ProductName", e.target.value)
                                                    }
                                                />
                                            ) : (
                                                product.ProductName
                                            )}
                                        </li>
                                        <li className="list-image">
                                            <img
                                                src={`/assets/pictures/${product.Image}`}
                                                alt={product.ProductName}
                                                width="70"
                                            />
                                        </li>
                                        <li className="list-price">
                                            {editMode && selectedProducts.includes(product.ProductID) ? (
                                                <input
                                                    className="input-price"
                                                    value={product.Price}
                                                    onChange={(e) =>
                                                        handleProductChange(product.ProductID, "Price", Number(e.target.value))
                                                    }
                                                />
                                            ) : (
                                                `${product.Price.toLocaleString("vi-VN")}đ`
                                            )}
                                        </li>
                                        <li className="list-category">{product.CategoryName}</li>
                                        <li className="list-stock">
                                            {product.StockQuantity}
                                            <button className="view-detail">Xem chi tiết</button>
                                        </li>
                                    </ul>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ✅ Dùng React.memo để tránh render lại khi props không đổi
export const ProductOverview = React.memo(ProductOverviewComponent);
