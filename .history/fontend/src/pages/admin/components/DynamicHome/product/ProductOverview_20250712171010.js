import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import ToolBar from "../../ToolBar";
import "./style.scss";

// 💡 Component chính hiển thị danh sách sản phẩm
const ProductOverviewComponent = () => {
    const { request } = useHttp();

    // ==============================
    // 🟢 State quản lý dữ liệu sản phẩm & danh mục
    // ==============================
    const [categories, setCategories] = useState([]); // Danh sách danh mục sản phẩm
    const [products, setProducts] = useState([]); // Danh sách sản phẩm đang hiển thị (có thể chỉnh sửa)
    const [originalProducts, setOriginalProducts] = useState([]); // Danh sách sản phẩm gốc (để reset khi hủy)
    const [selectedCategory, setSelectedCategory] = useState("Tất cả"); // Danh mục đang được chọn

    // ==============================
    // 🎛️ State điều khiển UI danh mục & filter
    // ==============================
    const [filterOpen, setFilterOpen] = useState(false); // Mở/tắt panel bộ lọc bên trái
    const [showFilterContent, setShowFilterContent] = useState(false); // Hiển thị nội dung bộ lọc
    const [showCategories, setShowCategories] = useState(true); // Hiện/ẩn danh mục
    const [containerVisible, setContainerVisible] = useState(true); // Hiện/ẩn container danh mục
    const [showCloseButton, setShowCloseButton] = useState(true); // Hiện/ẩn nút đóng danh mục

    // ==============================
    // 🟢 State chọn & chỉnh sửa sản phẩm
    // ==============================
    const [selectMode, setSelectMode] = useState(false); // Bật/tắt chế độ chọn nhiều sản phẩm
    const [selectedProducts, setSelectedProducts] = useState([]); // Mảng chứa ID sản phẩm đang được chọn
    const [editMode, setEditMode] = useState(false); // Bật/tắt chế độ chỉnh sửa sản phẩm


    const [searchKeyword, setSearchKeyword] = useState("");
    // ==============================
    // ⚡ Load dữ liệu danh mục & sản phẩm
    // ==============================
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoryRes, productRes] = await Promise.all([
                    request("GET", `${API_BASE}/api/user/products/loadCategory`),
                    request("GET", `${API_BASE}/api/user/products/loadAllProducts`),
                ]);
                setCategories(categoryRes.data);
                setProducts(productRes.data);
                setOriginalProducts(productRes.data); // ⭐ Lưu lại bản gốc để reset khi cần
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            }
        };
        fetchData();
    }, [request]);

    // ==============================
    // 🔍 Lọc sản phẩm theo danh mục & keyword
    // ==============================
    const filteredProducts = useMemo(() => {
        confirm
        return products.filter((product) => {
            const matchCategory =
                selectedCategory === "Tất cả" ||
                product.CategoryName === selectedCategory;
            const matchKeyword =
                product.ProductName.toLowerCase().includes(
                    searchKeyword.toLowerCase()
                ) || product.ProductID.toString().includes(searchKeyword.toLowerCase());
            return matchCategory && matchKeyword;
        });
    }, [products, selectedCategory, searchKeyword]);

    // ==============================
    // 🎛️ Xử lý danh mục (mở / đóng)
    // ==============================
    const handleOpen = () => {
        setShowCloseButton(true);
        setContainerVisible(true);
        setTimeout(() => setShowCategories(true), 50);
    };

    const handleCloseCategories = () => {
        setShowCloseButton(false);
        setShowCategories(false);

        const lastDelay = (categories.length - 1) * 100; // mỗi nút 0.1s = 100ms
        const transitionTime = 400; // 0.4s = 400ms
        const totalTime = lastDelay + transitionTime - 200; // ✅ Trừ 200ms cho mượt

        setTimeout(() => {
            setContainerVisible(false);
        }, totalTime);
    };

    // ==============================
    // 🎛️ Xử lý toggle filter
    // ==============================
    const handleToggleFilter = () => {
        if (!filterOpen) {
            setFilterOpen(true);
            setTimeout(() => setShowFilterContent(true), 300);
        } else {
            setShowFilterContent(false);
            setFilterOpen(false);
        }
    };

    // ==============================
    // 🟢 Xử lý chọn nhiều sản phẩm
    // ==============================
    const handleToggleSelectMode = () => {
        // Nếu đang bật edit, reset sản phẩm về gốc trước khi hủy
        if (editMode) {
            setProducts((prev) =>
                prev.map((p) => {
                    if (selectedProducts.includes(p.ProductID)) {
                        const original = originalProducts.find(
                            (o) => o.ProductID === p.ProductID
                        );
                        return original ? { ...original } : p;
                    }
                    return p;
                })
            );
        }

        setSelectMode(!selectMode);
        setSelectedProducts([]);
        setEditMode(false); // Tắt edit nếu đang bật
    };

    // ==============================
    // 🟢 Xử lý chọn checkbox sản phẩm
    // ==============================
    const handleCheckboxChange = (productId) => {
        setSelectedProducts((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    // ==============================
    // 💾 Xử lý lưu hoặc chuyển sang chế độ chỉnh sửa
    // ==============================
    const handleEditOrSave = async () => {
        if (editMode) {
            const confirmSave = window.confirm("Bạn có chắc chắn muốn lưu thay đổi?");
            if (!confirmSave) return;

            const updatedProducts = products.filter((p) =>
                selectedProducts.includes(p.ProductID)
            );

            try {
                await request(
                    "PUT",
                    `${API_BASE}/api/admin/products/updateProducts`,
                    updatedProducts,
                    "Cập nhật sản phẩm"
                );
                alert("Đã lưu thành công!");

                // Sau khi lưu, cập nhật lại bản gốc
                setOriginalProducts((prev) =>
                    prev.map((o) => {
                        const updated = updatedProducts.find(
                            (u) => u.ProductID === o.ProductID
                        );
                        return updated ? { ...updated } : o;
                    })
                );
            } catch (error) {
                console.error("Lỗi khi lưu:", error);
                alert("Có lỗi xảy ra khi lưu dữ liệu!");
            }

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

    // ==============================
    // ✏️ Xử lý thay đổi giá trị sản phẩm local state
    // ==============================
    const handleProductChange = (productId, field, value) => {
        setProducts((prev) =>
            prev.map((product) =>
                product.ProductID === productId
                    ? { ...product, [field]: value }
                    : product
            )
        );
    };

    // ==============================
    // 💻 Render UI
    // ==============================
    return (
        <>
            <ToolBar onSearchChange={setSearchKeyword} />
            {/* Các phần còn lại */}
            <div className="product-wrapper">
                {/* ========== DANH MỤC ========== */}
                <div className="product-topbar">
                    {!containerVisible && (
                        <button className="toggle-button" onClick={handleOpen}>
                            Mở danh mục ➜
                        </button>
                    )}
                    {containerVisible && (
                        <div className="category-buttons">
                            <button onClick={() => setSelectedCategory("Tất cả")}>
                                Tất cả
                            </button>
                            {categories.map((category, index) => {
                                const total = categories.length;
                                const delay = showCategories
                                    ? `${index * 0.1}s`
                                    : `${(total - 1 - index) * 0.1}s`;
                                return (
                                    <button
                                        key={category.CategoryID}
                                        onClick={() => setSelectedCategory(category.CategoryName)}
                                        style={{
                                            transition: "all 0.4s ease",
                                            transitionDelay: delay,
                                            transform: showCategories ? "translateX(0)" : "translateX(-20px)",
                                            opacity: showCategories ? 1 : 0,
                                        }}
                                    >
                                        {category.CategoryName}
                                    </button>
                                );
                            })}



                            {showCloseButton && (
                                <button
                                    className="close-button"
                                    onClick={handleCloseCategories}
                                    style={{
                                        transition: "all 0.4s ease",
                                        transitionDelay: `${categories.length * 0.1 + 0.1}s`,
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

                {/* ========== NỘI DUNG ========== */}
                <div className={`product-content ${filterOpen ? "open" : ""}`}>
                    <div className="product-left">
                        <button className="btn-select-mode" onClick={handleToggleSelectMode}>
                            {selectMode ? "Huỷ chọn" : "Chọn sản phẩm"}
                        </button>

                        <button className="btn-add" >Thêm SP</button>

                        <button className="btn-edit-save" onClick={handleEditOrSave}>
                            {editMode ? "Lưu" : "Chỉnh sửa"}
                        </button>

                        <button className="btn-delete">Xóa</button>

                        <button className="btn-export">Xuất Excel</button>

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
                                <ul className="field-name list-unstyled">
                                    <li className="field-col list-stt">STT</li>
                                    <li className="field-col list-id">ID SP</li>
                                    <li className="field-col list-name">Tên sản phẩm</li>
                                    <li className="field-col list-image">Ảnh</li>
                                    <li className="field-col list-price">Giá</li>
                                    <li className="field-col list-category">Danh mục</li>
                                    <li className="field-col list-stock">Tồn kho</li>
                                </ul>
                                <div className="data">
                                    {filteredProducts.map((product, index) => (
                                        <ul
                                            key={product.ProductID}
                                            className="list-unstyled row-data"
                                        >
                                            <li className="list-stt">
                                                {selectMode && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.includes(product.ProductID)}
                                                        onChange={() =>
                                                            handleCheckboxChange(product.ProductID)
                                                        }
                                                    />
                                                )}
                                                {index + 1}
                                            </li>
                                            <li className="list-id">{product.ProductID}</li>
                                            <li className="list-name">
                                                {editMode &&
                                                    selectedProducts.includes(product.ProductID) ? (
                                                    <textarea
                                                        className="input-name"
                                                        value={product.ProductName}
                                                        onChange={(e) =>
                                                            handleProductChange(
                                                                product.ProductID,
                                                                "ProductName",
                                                                e.target.value
                                                            )
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
                                                {editMode &&
                                                    selectedProducts.includes(product.ProductID) ? (
                                                    <input
                                                        className="input-price"
                                                        value={product.Price}
                                                        onChange={(e) =>
                                                            handleProductChange(
                                                                product.ProductID,
                                                                "Price",
                                                                Number(e.target.value)
                                                            )
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
        </>
    );
};

// ✅ Dùng React.memo để tránh render lại khi props không đổi
export const ProductOverview = React.memo(ProductOverviewComponent);
