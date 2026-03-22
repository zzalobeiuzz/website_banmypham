import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { FixedSizeList as List } from "react-window"; // 📜 Virtualized list để render danh sách dài
import { API_BASE, UPLOAD_BASE } from "../../../../../constants"; // 🌐 API endpoint & path upload
import useHttp from "../../../../../hooks/useHttp"; // ⚡ Custom hook request HTTP
import ToolBar from "../../ToolBar"; // 🔍 Toolbar search/filter
import "./style.scss"; // 🎨 Styles

const ProductOverviewComponent = () => {
  const { request } = useHttp(); // ⚡ Gọi request HTTP
  // 🏷 State quản lý dữ liệu & UI
  const [categories, setCategories] = useState([]); // 📂 Danh mục sản phẩm
  const [products, setProducts] = useState([]); // 🛍 Danh sách sản phẩm đang hiển thị
  const [originalProducts, setOriginalProducts] = useState([]); // 🗄 Dữ liệu gốc, dùng khi hủy chỉnh sửa
  const [selectedCategory, setSelectedCategory] = useState("Tất cả"); // 📌 Category filter
  const [filterOpen, setFilterOpen] = useState(false); // 🔧 Toggle bộ lọc
  const [showFilterContent, setShowFilterContent] = useState(false); // 👀 Hiển thị nội dung filter
  const [showCategories, setShowCategories] = useState(true); // 👀 Hiển thị category buttons
  const [containerVisible, setContainerVisible] = useState(true); // 🖼 Hiển thị container category
  const [showCloseButton, setShowCloseButton] = useState(true); // ❌ Hiển thị nút đóng category
  const [selectedProducts, setSelectedProducts] = useState([]); // 🗂 Danh sách sản phẩm được chọn
  const [editMode, setEditMode] = useState(false); // ✏️ Chế độ chỉnh sửa
  const [searchKeyword, setSearchKeyword] = useState(""); // 🔍 Keyword search
  const navigate = useNavigate(); // 🔀 Navigate giữa route

  // 🌐 Lấy dữ liệu categories & products từ API khi component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryRes, productRes] = await Promise.all([
          request("GET", `${API_BASE}/api/user/products/loadCategory`), // 📂 Lấy danh mục
          request("GET", `${API_BASE}/api/user/products/loadAllProducts`), // 🛍 Lấy tất cả sản phẩm
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

  // ➕ Navigate đến trang thêm sản phẩm
  const handleAddProduct = () => {
    navigate("/admin/product/add");
  };

  // 🔎 Filter products theo category & search keyword
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = selectedCategory === "Tất cả" || product.CategoryName === selectedCategory;
      const matchKeyword =
        product.ProductName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        product.ProductID.toString().includes(searchKeyword.toLowerCase());
      return matchCategory && matchKeyword;
    });
  }, [products, selectedCategory, searchKeyword]);

  // ✔ Toggle checkbox chọn sản phẩm
  const handleCheckboxChange = useCallback((productId) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.includes(productId);

      // Nếu bỏ tích khi đang edit: hoàn tác dữ liệu sản phẩm này về bản gốc.
      if (isSelected) {
        if (editMode) {
          setProducts((prevProducts) =>
            prevProducts.map((product) => {
              if (product.ProductID !== productId) return product;

              // Tìm dữ liệu gốc của sản phẩm này để khôi phục
              const original = originalProducts.find((o) => o.ProductID === productId);
              return original ? { ...original } : product;
            })
          );
        }
        return prev.filter((id) => id !== productId);
      }

      // Nếu tích mới: thêm product vào danh sách được chọn để cho phép chỉnh sửa.
      return [...prev, productId];
    });
  }, [editMode, originalProducts]);

  // ✏️ Thay đổi dữ liệu product khi chỉnh sửa
  const handleProductChange = useCallback((productId, field, value) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.ProductID === productId ? { ...product, [field]: value } : product
      )
    );
  }, []);

  // 💰 Chuẩn hóa giá về số và format theo VND có dấu chấm ngăn cách nghìn.
  const parsePriceInput = useCallback((rawValue) => {
    const digitsOnly = String(rawValue ?? "").replace(/\D/g, "");
    return digitsOnly ? Number(digitsOnly) : 0;
  }, []);

  // 💰 Format giá hiển thị theo VND có dấu chấm ngăn cách nghìn và đuôi "đ"
  const formatPriceInput = useCallback((priceValue) => {
    const safePrice = Number(priceValue) || 0;
    return `${safePrice.toLocaleString("vi-VN")}đ`;
  }, []);

  // 🔄 Nhận giá trị người dùng nhập -> chuẩn hóa -> cập nhật về state dạng số.
  const handlePriceChange = useCallback((productId, rawValue) => {
    const normalizedPrice = parsePriceInput(rawValue);
    handleProductChange(productId, "Price", normalizedPrice);
  }, [handleProductChange, parsePriceInput]);

  // 🎯 Giữ con trỏ luôn đứng ngay trước ký tự "đ" trong ô giá.
  const keepCaretBeforeCurrency = useCallback((event) => {
    const input = event.target;
    const displayValue = String(input.value ?? "");
    const currencyIndex = displayValue.lastIndexOf("đ");
    const nextCaretPos = currencyIndex >= 0 ? currencyIndex : displayValue.length;

    requestAnimationFrame(() => {
      if (document.activeElement !== input) return;
      input.setSelectionRange(nextCaretPos, nextCaretPos);
    });
  }, []);
  //
  // 📦 Gom props cần thiết để truyền cho mỗi row của react-window.
  const listData = useMemo(
    () => ({
      filteredProducts,
      editMode,
      selectedProducts,
      handleCheckboxChange,
      handleProductChange,
      handlePriceChange,
      keepCaretBeforeCurrency,
      formatPriceInput,
      navigate,
    }),
    [
      filteredProducts,
      editMode,
      selectedProducts,
      handleCheckboxChange,
      handleProductChange,
      handlePriceChange,
      keepCaretBeforeCurrency,
      formatPriceInput,
      navigate,
    ]
  );

  // ✅ Render mỗi dòng sản phẩm trong danh sách (dùng cho react-window)
  const renderProductRow = useCallback(({ index, style, data }) => {
    const {
      filteredProducts: rowProducts,
      editMode: isEditMode,
      selectedProducts: rowSelectedProducts,
      handleCheckboxChange: onCheckboxChange,
      handleProductChange: onProductChange,
      handlePriceChange: onPriceChange,
      keepCaretBeforeCurrency: keepCaret,
      formatPriceInput: formatPrice,
      navigate: goTo,
    } = data;

    const product = rowProducts[index];
    if (!product) return null;

    return (
      <ul
        key={product.ProductID}
        className={`list-unstyled row-data ${index % 2 === 0 ? "even" : "odd"}`}
        style={style}
      >
        {/* ✔ Checkbox chọn */}
        <li className="list-stt">
          <input
            type="checkbox"
            checked={rowSelectedProducts.includes(product.ProductID)}
            onChange={() => onCheckboxChange(product.ProductID)}
          />

          {index + 1}
        </li>

        {/* 🏷 Các trường product */}
        <li className="list-id">{product.ProductID}</li>
        <li className="list-name">
          {isEditMode && rowSelectedProducts.includes(product.ProductID) ? (
            <textarea
              className="input-name"
              value={product.ProductName}
              onChange={(e) => onProductChange(product.ProductID, "ProductName", e.target.value)}
              style={{
                color: "#111",
                caretColor: "#111",
                WebkitTextFillColor: "#111",
                backgroundColor: "#fff",
              }}
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
          {isEditMode && rowSelectedProducts.includes(product.ProductID) ? (
            <input
              className="input-price"
              inputMode="numeric"
              value={formatPrice(product.Price)}
              onFocus={keepCaret}
              onClick={keepCaret}
              onKeyUp={keepCaret}
              onChange={(e) => {
                onPriceChange(product.ProductID, e.target.value);
                keepCaret(e);
              }}
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
            onClick={() => goTo(`/admin/product/detail/${product.ProductID}`)}
          >
            Xem chi tiết
          </button>
        </li>
      </ul>
    );
  }, []);

  // 🔼 Mở category container
  const handleOpen = () => {
    setShowCloseButton(true);
    setContainerVisible(true);
    setTimeout(() => setShowCategories(true), 50); // animation delay
  };

  // 🔽 Đóng category container
  const handleCloseCategories = () => {
    setShowCloseButton(false);
    setShowCategories(false);
    const lastDelay = (categories.length - 1) * 100;
    const transitionTime = 400;
    const totalTime = lastDelay + transitionTime - 200;
    setTimeout(() => setContainerVisible(false), totalTime);
  };

  // 🔧 Mở/Đóng filter sidebar
  const handleToggleFilter = () => {
    if (!filterOpen) {
      setFilterOpen(true);
      setTimeout(() => setShowFilterContent(true), 300);
    } else {
      setShowFilterContent(false);
      setFilterOpen(false);
    }
  };

  // ↩ Khôi phục dữ liệu gốc cho các sản phẩm đã chọn
  const restoreSelectedProducts = useCallback(() => {
    setProducts((prev) =>
      prev.map((product) => {
        if (!selectedProducts.includes(product.ProductID)) return product;
        const original = originalProducts.find((o) => o.ProductID === product.ProductID);
        return original ? { ...original } : product;
      })
    );
  }, [originalProducts, selectedProducts]);

  // ====================✏️ Xử lý Chỉnh sửa / Lưu dữ liệu ====================
  const handleEditOrSave = async () => {
    //Khi chế độ chỉnh sửa đang bật thì khi ấn vào sẽ lưu nếu không lưu trả lại giá trị ban đầu
    if (editMode) {
      const confirmSave = window.confirm("Bạn có chắc chắn muốn lưu thay đổi?");
      // Nếu người dùng chọn không lưu, khôi phục dữ liệu gốc và tắt chế độ chỉnh sửa
      if (!confirmSave) {
        restoreSelectedProducts();
        setEditMode(false);
        setSelectedProducts([]);
        return;
      }

      const updatedProducts = products.filter((p) => selectedProducts.includes(p.ProductID));

      try {
        await request(
          "PUT",
          `${API_BASE}/api/admin/products/updateProducts`,
          updatedProducts,
          "Cập nhật sản phẩm"
        );
        alert("Đã lưu thành công!");

        // 🔄 Cập nhật dữ liệu gốc
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
      setSelectedProducts([]);
    } 
    else 
    {
      
      if (selectedProducts.length === 0) {
        
        alert("Vui lòng chọn ít nhất một sản phẩm trước khi chỉnh sửa.");
        return;
      }
      //đổi trạng thái chế độ sửa thành bật
      setEditMode(true);
    }
  };
  // ====================🗑 Xử lý Xóa sản phẩm ===================
  const handleDelete = async () => {
    if (selectedProducts.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm trước khi xóa.");
      return;
    }
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa các sản phẩm đã chọn?");
    if (!confirmDelete) return;
    try {
      await request(
        "DELETE",
        `${API_BASE}/api/admin/products/deleteProducts`,
          selectedProducts,
        "Xóa sản phẩm"
      );
      alert("Đã xóa thành công!");
      // Cập nhật lại danh sách sản phẩm sau khi xóa
      setProducts((prev) => prev.filter((p) => !selectedProducts.includes(p.ProductID)));
      setSelectedProducts([]);
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      alert("Có lỗi xảy ra khi xóa dữ liệu!");
    }
  };

  // ================= UI =================

  return (
    <div>
      {/* 🔍 Toolbar tìm kiếm */}
      <ToolBar title="Sản phẩm" onSearchChange={setSearchKeyword} />

      <div className="product-wrapper">
        {/* 🏷 Topbar category */}
        <div className="product-topbar">
          {!containerVisible && (
            <button className="toggle-button" onClick={handleOpen}>
              Mở danh mục ➜
            </button>
          )}
          {containerVisible && (
            <div className="category-buttons">
              {/* Tất cả category */}
              <button
                className={selectedCategory === "Tất cả" ? "active" : ""}
                onClick={() => setSelectedCategory("Tất cả")}
              >
                Tất cả
              </button>
              {/* Category dynamic */}
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
              {/* Close button */}
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

        {/* 📦 Nội dung chính: thao tác & danh sách sản phẩm */}
        <div className={`product-content ${filterOpen ? "open" : ""}`}>
          {/* 🛠 Sidebar thao tác & filter */}
          <div className="product-left">
            <button className="btn-add" onClick={handleAddProduct}>Tạo mới</button>
            <button className="btn-edit-save" onClick={handleEditOrSave}>
              {editMode ? "Lưu" : "Sửa"}
            </button>
            <button className="btn-delete" onClick={handleDelete}>Xóa</button>
            <button className="btn-export">Xuất Excel</button>

            {/* 🔧 Toggle filter */}
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

          {/* 🛍 Danh sách sản phẩm */}
          <div className="product-right">
            <div className="content">
              <div className="product-data">
                {/* Header table */}
                <ul className="field-name list-unstyled">
                  <li className="field-col list-stt">STT</li>
                  <li className="field-col list-id">ID SP</li>
                  <li className="field-col list-name">Tên sản phẩm</li>
                  <li className="field-col list-image">Ảnh</li>
                  <li className="field-col list-price">Giá</li>
                  <li className="field-col list-category">Danh mục</li>
                  <li className="field-col list-stock">Tồn kho</li>
                </ul>

                {/* 🏷 Product list virtualized */}
                <div className="data">
                  <List
                    height={600}
                    itemCount={filteredProducts.length}
                    itemSize={100}
                    width="100%"
                    itemData={listData}
                    itemKey={(index, data) => data.filteredProducts[index]?.ProductID ?? index}
                  >
                    {renderProductRow}
                  </List>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Outlet /> {/* Thêm dòng này để hiển thị component con như AddProduct, ProductDetail */}
    </div>
  );
};

export const ProductOverview = React.memo(ProductOverviewComponent); // 🧩 Memo để tránh re-render không cần thiết
