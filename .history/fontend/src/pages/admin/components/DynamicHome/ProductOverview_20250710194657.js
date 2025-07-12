import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = ({ searchKeyword }) => {
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
        console.error("Lỗi tải dữ liệu:", error.status, error.message);
      }
    };
    fetchData();
  }, [request]);

  const handleOpen = () => {
    setShowCloseButton(true);
    setContainerVisible(true);
    setTimeout(() => setShowCategories(true), 50);
  };

  const handleCloseCategories = () => {
    setShowCloseButton(false);
    setShowCategories(false);
    const totalTime = categories.length * 100 + 400;
    setTimeout(() => setContainerVisible(false), totalTime);
  };

  const handleToggleFilter = () => {
    if (!filterOpen) {
      setFilterOpen(true);
      setTimeout(() => setShowFilterContent(true), 300);
    } else {
      setShowFilterContent(false);
      setFilterOpen(false);
    }
  };

  const handleToggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedProducts([]);
    setEditMode(false);
  };

  const handleCheckboxChange = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleEditOrSave = () => {
    if (editMode) {
      console.log("Lưu dữ liệu:", products.filter((p) => selectedProducts.includes(p.ProductID)));
      // TODO: Gọi API lưu nếu cần

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

  const handleProductChange = (productId, field, value) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.ProductID === productId
          ? { ...product, [field]: value }
          : product
      )
    );
  };

  // ==========================
  // Lọc sản phẩm theo danh mục và từ khóa
  // ==========================
  const filteredProducts = products.filter((product) => {
    const matchCategory =
      selectedCategory === "Tất cả" || product.CategoryName === selectedCategory;
    const matchKeyword = product.ProductName.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchKeyword =
    product.ProductName.toLowerCase().includes(keyword) ||
    product.ProductID.toString().includes(keyword);
    return matchCategory && matchKeyword;
  });

  return (
    <div className="product-wrapper">
      <div className="product-topbar">
        {!containerVisible && (
          <button className="toggle-button" onClick={handleOpen}>
            Mở danh mục ➜
          </button>
        )}

        {containerVisible && (
          <div className="category-buttons">
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
                        <input
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
