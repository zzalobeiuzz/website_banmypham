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
    <div className="product-wrapper">
      <ToolBar onSearchChange={setSearchKeyword} />
      <div className="product-content">
        <div className="product-controls">
          <button onClick={handleToggleSelectMode}>
            {selectMode ? "Huỷ chọn" : "Chọn sản phẩm"}
          </button>
          <button onClick={handleEditOrSave}>{editMode ? "Lưu" : "Chỉnh sửa"}</button>
        </div>
        <div className="product-list">
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
                  className={`row-data ${index % 2 === 0 ? "even" : "odd"}`}
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
                    <button
                      className="view-detail"
                      onClick={() => navigate(`/admin/products/${product.ProductID}`)}
                    >
                      Xem chi tiết
                    </button>
                  </li>
                </ul>
              );
            }}
          </List>
        </div>
      </div>
    </div>
  );
};

export const ProductOverview = React.memo(ProductOverviewComponent);
