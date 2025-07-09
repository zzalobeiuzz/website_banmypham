import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import ToolBar from "../components/ToolBar";
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

  const [selectMode, setSelectMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editMode, setEditMode] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");

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

  // ===> FILTER sản phẩm theo category và từ khóa tìm kiếm
  const filteredProducts = products.filter((product) => {
    const matchCategory = selectedCategory === "Tất cả" || product.CategoryName === selectedCategory;
    const matchKeyword = product.ProductName.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchCategory && matchKeyword;
  });

  return (
    <div className="product-wrapper">
      <ToolBar searchKeyword={searchKeyword} setSearchKeyword={setSearchKeyword} />

      {/* Các phần danh mục và danh sách sản phẩm giữ nguyên... */}
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
