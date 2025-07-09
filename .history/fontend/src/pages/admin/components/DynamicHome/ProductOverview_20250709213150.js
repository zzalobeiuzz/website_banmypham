import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
  const { request } = useHttp();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  const [filterOpen, setFilterOpen] = useState(false);
  const [showFilterContent, setShowFilterContent] = useState(false);

  const [showCategories, setShowCategories] = useState(true);
  const [containerVisible, setContainerVisible] = useState(true);
  const [showCloseButton, setShowCloseButton] = useState(true);

  // 👉 State mới để kiểm soát chọn sản phẩm
  const [selectMode, setSelectMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

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
    setSelectedProducts([]); // Clear khi bật/tắt
  };

  const handleCheckboxChange = (productId) => {
    setSelectedProducts((prevSelected) =>
      prevSelected.includes(productId)
        ? prevSelected.filter((id) => id !== productId)
        : [...prevSelected, productId]
    );
  };

  const filteredProducts =
    selectedCategory === "Tất cả"
      ? products
      : products.filter((product) => product.CategoryName === selectedCategory);

  return (
    <div className="product-wrapper">
      <div className="product-topbar">
        {/* ... category buttons ... */}
      </div>

      <div className={`product-content ${filterOpen ? "open" : ""}`}>
        <div className="product-left">
          <button onClick={handleToggleSelectMode}>
            {selectMode ? "Huỷ chọn" : "Chọn sản phẩm"}
          </button>
          <button>Chỉnh sửa</button>
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
              <>
                <span>✖ Bộ lọc sản phẩm</span>
              </>
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
                <li className="field-col list-stt">
                  {selectMode && <input type="checkbox" disabled />}
                  STT
                </li>
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
                    <li className="list-name">{product.ProductName}</li>
                    <li className="list-image">
                      <img
                        src={`/assets/pictures/${product.Image}`}
                        alt={product.ProductName}
                        width="70"
                      />
                    </li>
                    <li className="list-price">
                      {product.Price.toLocaleString("vi-VN")}đ
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
