import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import ToolBar from "../../ToolBar";
import "./style.scss";

const ProductOverviewComponent = () => {
  const { request } = useHttp();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [originalProducts, setOriginalProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [filterOpen, setFilterOpen] = useState(false);
  const [showFilterContent, setShowFilterContent] = useState(false);
  const [showCategories, setShowCategories] = useState(true);
  const [containerVisible, setContainerVisible] = useState(true);
  const [showCloseButton, setShowCloseButton] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryRes, productRes] = await Promise.all([
          request("GET", `${API_BASE}/api/user/products/loadCategory`),
          request("GET", `${API_BASE}/api/user/products/loadAllProducts`),
        ]);
        setCategories(categoryRes.data);
        setProducts(productRes.data);
        setOriginalProducts(productRes.data);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      }
    };
    fetchData();
  }, [request]);

  const handleAddProduct = () => {
    navigate("/admin/product/add");
  };
  const NoScrollWrapper = React.forwardRef((props, ref) => (
    <div
      ref={ref}
      {...props}
      style={{
        ...props.style,
        overflowY: "visible", // 🔒 Không scroll trong List
        willChange: "auto",
      }}
    />
  ));
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = selectedCategory === "Tất cả" || product.CategoryName === selectedCategory;
      const matchKeyword =
        product.ProductName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        product.ProductID.toString().includes(searchKeyword.toLowerCase());
      return matchCategory && matchKeyword;
    });
  }, [products, selectedCategory, searchKeyword]);

  const handleCheckboxChange = useCallback((productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const handleProductChange = useCallback((productId, field, value) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.ProductID === productId ? { ...product, [field]: value } : product
      )
    );
  }, []);

  const handleOpen = () => {
    setShowCloseButton(true);
    setContainerVisible(true);
    setTimeout(() => setShowCategories(true), 50);
  };

  const handleCloseCategories = () => {
    setShowCloseButton(false);
    setShowCategories(false);
    const lastDelay = (categories.length - 1) * 100;
    const transitionTime = 400;
    const totalTime = lastDelay + transitionTime - 200;
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
    if (editMode) {
      setProducts((prev) =>
        prev.map((p) => {
          if (selectedProducts.includes(p.ProductID)) {
            const original = originalProducts.find((o) => o.ProductID === p.ProductID);
            return original ? { ...original } : p;
          }
          return p;
        })
      );
    }
    setSelectMode(!selectMode);
    setSelectedProducts([]);
    setEditMode(false);
  };

  const handleEditOrSave = async () => {
    if (editMode) {
      const confirmSave = window.confirm("Bạn có chắc chắn muốn lưu thay đổi?");
      if (!confirmSave) return;

      const updatedProducts = products.filter((p) => selectedProducts.includes(p.ProductID));

      try {
        await request(
          "PUT",
          `${API_BASE}/api/admin/products/updateProducts`,
          updatedProducts,
          "Cập nhật sản phẩm"
        );
        alert("Đã lưu thành công!");

        setOriginalProducts((prev) =>
          prev.map((o) => {
            const updated = updatedProducts.find((u) => u.ProductID === o.ProductID);
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

  return (
    <>
      <ToolBar onSearchChange={setSearchKeyword} />
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
                className={selectedCategory === "Tất cả" ? "active" : ""}
                onClick={() => setSelectedCategory("Tất cả")}
              >
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
                    className={selectedCategory === category.CategoryName ? "active" : ""}
                    onClick={() => setSelectedCategory(category.CategoryName)}
                    style={{
                      transition: "opacity 0.4s ease, transform 0.4s ease",
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
                    transition: "opacity 0.4s ease, transform 0.4s ease",
                    transitionDelay: `${categories.length * 0.1 + 0.1}s`,
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
            <button className="btn-select-mode" onClick={handleToggleSelectMode}>
              {selectMode ? "Huỷ chọn" : "Chọn sản phẩm"}
            </button>
            <button className="btn-add" onClick={handleAddProduct}>Thêm SP</button>
            <button className="btn-edit-save" onClick={handleEditOrSave}>
              {editMode ? "Lưu" : "Chỉnh sửa"}
            </button>
            <button className="btn-delete">Xóa</button>
            <button className="btn-export">Xuất Excel</button>

            <div className="filter-toggle-header" onClick={handleToggleFilter}>
              {!filterOpen ? (
                <>
                  <img
                    src={`${UPLOAD_BASE}/icons/icons8-filter.gif`}
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
                  <List
                    height={600}
                    itemCount={filteredProducts.length}
                    itemSize={100}
                    width="100%"
                  >
                    {({ index, style }) => {
                      const product = filteredProducts[index];
                      return (
                        <ul
                          key={product.ProductID}
                          className={`list-unstyled row-data ${index % 2 === 0 ? "even" : "odd"}`}
                          style={style}
                        >
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
                                onChange={(e) => handleProductChange(product.ProductID, "ProductName", e.target.value)}
                              />
                            ) : (
                              product.ProductName
                            )}
                          </li>
                          <li className="list-image">
                            <img
                              src={`${UPLOAD_BASE}/pictures/${product.Image}`}
                              alt={product.ProductName}
                              width="70"
                            />
                          </li>
                          <li className="list-price">
                            {editMode && selectedProducts.includes(product.ProductID) ? (
                              <input
                                className="input-price"
                                value={product.Price}
                                onChange={(e) => handleProductChange(product.ProductID, "Price", Number(e.target.value))}
                              />
                            ) : (
                              `${product.Price.toLocaleString("vi-VN")}đ`
                            )}
                          </li>
                          <li className="list-category">{product.CategoryName}</li>
                          <li className="list-stock">
                            {product.StockQuantity}
                            <button
                              className="view-detail"
                              onClick={() => navigate(`/admin/products/${product.ProductID}`)}
                            >Xem chi tiết</button>
                          </li>
                        </ul>
                      );
                    }}
                  </List>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const ProductOverview = React.memo(ProductOverviewComponent);