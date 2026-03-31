import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { FixedSizeList as List } from "react-window"; // 📜 Virtualized list để render danh sách dài
import {
  FaEdit,
  FaFileExcel,
  FaPlus,
  FaSave,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants"; // 🌐 API endpoint & path upload
import useHttp from "../../../../../hooks/useHttp"; // ⚡ Custom hook request HTTP
import ToolBar from "../../ToolBar"; // 🔍 Toolbar search/filter
import ExportProductsExcelButton from "./ExportProductsExcelButton";
import "./style.scss"; // 🎨 Styles

const ProductOverviewComponent = () => {
  const { request } = useHttp(); // ⚡ Gọi request HTTP
  // 🏷 State quản lý dữ liệu & UI
  const [categories, setCategories] = useState([]); // 📂 Danh mục sản phẩm
  const [products, setProducts] = useState([]); // 🛍 Danh sách sản phẩm đang hiển thị
  const [originalProducts, setOriginalProducts] = useState([]); // 🗄 Dữ liệu gốc, dùng khi hủy chỉnh sửa
  const [selectedCategory, setSelectedCategory] = useState("Tất cả"); // 📌 Category filter
  const [showCategories, setShowCategories] = useState(true); // 👀 Hiển thị category buttons
  const [containerVisible, setContainerVisible] = useState(true); // 🖼 Hiển thị container category
  const [showCloseButton, setShowCloseButton] = useState(true); // ❌ Hiển thị nút đóng category
  const [leftExpanded, setLeftExpanded] = useState(false); // ↔ Expand/collapse left panel
  const [selectedProducts, setSelectedProducts] = useState([]); // 🗂 Danh sách sản phẩm được chọn
  const [editMode, setEditMode] = useState(false); // ✏️ Chế độ chỉnh sửa
  const [searchKeyword, setSearchKeyword] = useState(""); // 🔍 Keyword search
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const categoryButtonsRef = useRef(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });
  const navigate = useNavigate(); // 🔀 Navigate giữa route

  const updateCategoryScrollState = useCallback(() => {
    const el = categoryButtonsRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 1);
  }, []);

  // 🌐 Lấy dữ liệu categories & products từ API khi component mount
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const categoryPromise = request("GET", `${API_BASE}/api/user/products/loadCategory`)
        .then((categoryRes) => {
          if (!isMounted) return;
          setCategories(Array.isArray(categoryRes?.data) ? categoryRes.data : []);
        })
        .catch((error) => {
          console.error("Lỗi tải danh mục:", error);
          if (!isMounted) return;
          setCategories([]);
        });

      const productPromise = request("GET", `${API_BASE}/api/user/products/loadAllProducts`)
        .then((productRes) => {
          if (!isMounted) return;
          const rows = Array.isArray(productRes?.data) ? productRes.data : [];
          setProducts(rows);
          setOriginalProducts(rows);
        })
        .catch((error) => {
          console.error("Lỗi tải sản phẩm:", error);
          if (!isMounted) return;
          setProducts([]);
          setOriginalProducts([]);
        });

      await Promise.allSettled([categoryPromise, productPromise]);
    };
    
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [request]);

  useEffect(() => {
    updateCategoryScrollState();
  }, [categories, containerVisible, updateCategoryScrollState]);

  useEffect(() => {
    const onResize = () => updateCategoryScrollState();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateCategoryScrollState]);

  const scrollCategoryStrip = (direction) => {
    const el = categoryButtonsRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction * 220,
      behavior: "smooth",
    });
  };

  const handleCategoryMouseDown = (event) => {
    const el = categoryButtonsRef.current;
    if (!el) return;

    dragStateRef.current = {
      isDragging: true,
      startX: event.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
    };
  };

  const handleCategoryMouseMove = (event) => {
    const el = categoryButtonsRef.current;
    if (!el || !dragStateRef.current.isDragging) return;

    event.preventDefault();
    const x = event.pageX - el.offsetLeft;
    const walk = (x - dragStateRef.current.startX) * 1.2;
    el.scrollLeft = dragStateRef.current.scrollLeft - walk;
  };

  const stopCategoryDragging = () => {
    dragStateRef.current.isDragging = false;
  };

  const handleCategoryTouchStart = (event) => {
    const el = categoryButtonsRef.current;
    if (!el) return;

    dragStateRef.current = {
      isDragging: true,
      startX: event.touches[0].pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
    };
  };

  const handleCategoryTouchMove = (event) => {
    const el = categoryButtonsRef.current;
    if (!el || !dragStateRef.current.isDragging) return;

    const x = event.touches[0].pageX - el.offsetLeft;
    const walk = (x - dragStateRef.current.startX) * 1.1;
    el.scrollLeft = dragStateRef.current.scrollLeft - walk;
  };

  // ➕ Navigate đến trang thêm sản phẩm
  const handleAddProduct = () => {
    navigate("/admin/product/add");
  };

  // 🔎 Filter products theo category & search keyword
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === "Tất cả" ||
        product.CategoryName === selectedCategory;
      const matchKeyword =
        product.ProductName.toLowerCase().includes(
          searchKeyword.toLowerCase(),
        ) || product.ProductID.toString().includes(searchKeyword.toLowerCase());
      return matchCategory && matchKeyword;
    });
  }, [products, selectedCategory, searchKeyword]);

  // 📊 Thống kê nhanh thay cho bộ lọc
  const overviewStats = useMemo(() => {
    const totalProducts = filteredProducts.length;
    const selectedCount = selectedProducts.length;
    const totalStock = filteredProducts.reduce(
      (sum, p) => sum + (Number(p.StockQuantity) || 0),
      0,
    );
    const averagePrice =
      totalProducts > 0
        ? Math.round(
            filteredProducts.reduce((sum, p) => sum + (Number(p.Price) || 0), 0) /
              totalProducts,
          )
        : 0;

    return {
      totalProducts,
      selectedCount,
      totalStock,
      averagePrice,
    };
  }, [filteredProducts, selectedProducts]);

  // ✔ Toggle checkbox chọn sản phẩm
  const handleCheckboxChange = useCallback(
    (productId) => {
      setSelectedProducts((prev) => {
        const isSelected = prev.includes(productId);

        // Nếu bỏ tích khi đang edit: hoàn tác dữ liệu sản phẩm này về bản gốc.
        if (isSelected) {
          if (editMode) {
            setProducts((prevProducts) =>
              prevProducts.map((product) => {
                if (product.ProductID !== productId) return product;

                // Tìm dữ liệu gốc của sản phẩm này để khôi phục
                const original = originalProducts.find(
                  (o) => o.ProductID === productId,
                );
                return original ? { ...original } : product;
              }),
            );
          }
          return prev.filter((id) => id !== productId);
        }

        // Nếu tích mới: thêm product vào danh sách được chọn để cho phép chỉnh sửa.
        return [...prev, productId];
      });
    },
    [editMode, originalProducts],
  );

  // ✏️ Thay đổi dữ liệu product khi chỉnh sửa
  const handleProductChange = useCallback((productId, field, value) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.ProductID === productId
          ? { ...product, [field]: value }
          : product,
      ),
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
  const handlePriceChange = useCallback(
    (productId, rawValue) => {
      const normalizedPrice = parsePriceInput(rawValue);
      handleProductChange(productId, "Price", normalizedPrice);
    },
    [handleProductChange, parsePriceInput],
  );

  // 🎯 Giữ con trỏ luôn đứng ngay trước ký tự "đ" trong ô giá.
  const keepCaretBeforeCurrency = useCallback((event) => {
    const input = event.target;
    const displayValue = String(input.value ?? "");
    const currencyIndex = displayValue.lastIndexOf("đ");
    const nextCaretPos =
      currencyIndex >= 0 ? currencyIndex : displayValue.length;

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
    ],
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
              onChange={(e) =>
                onProductChange(
                  product.ProductID,
                  "ProductName",
                  e.target.value,
                )
              }
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
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
            }}
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
            onClick={() => {
              if (!product.ProductID) {
                alert("Sản phẩm chưa có ID, không thể xem chi tiết!");
                return;
              }
              goTo(`/admin/product/detail/${product.ProductID}`);
            }}
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

  // (Đã loại bỏ bộ lọc sidebar; sử dụng khối "Tổng quan nhanh" bên trái)

  // ↩ Khôi phục dữ liệu gốc cho các sản phẩm đã chọn
  const restoreSelectedProducts = useCallback(() => {
    setProducts((prev) =>
      prev.map((product) => {
        if (!selectedProducts.includes(product.ProductID)) return product;
        const original = originalProducts.find(
          (o) => o.ProductID === product.ProductID,
        );
        return original ? { ...original } : product;
      }),
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

      const updatedProducts = products.filter((p) =>
        selectedProducts.includes(p.ProductID),
      );

      // Gọi API để cập nhật sản phẩm
      try {
        const res = await request(
          "PUT",
          `${API_BASE}/api/admin/products/updateProducts`,
          updatedProducts,
          "Cập nhật sản phẩm",
        );
        alert(res.message || "Đã lưu thay đổi thành công!");

        // 🔄 Cập nhật dữ liệu gốc
        setOriginalProducts((prev) =>
          prev.map((o) => {
            const updated = updatedProducts.find(
              (u) => u.ProductID === o.ProductID,
            );
            return updated ? { ...updated } : o;
          }),
        );
      } catch (error) {
        console.error("Lỗi khi lưu:", error);
        alert(error.message || "Có lỗi xảy ra khi lưu dữ liệu!");
        // 🔄 Khôi phục dữ liệu ban đầu khi có lỗi
        restoreSelectedProducts();
        setEditMode(false);
        setSelectedProducts([]);
        return;
      }

      setEditMode(false);
      setSelectedProducts([]);
    } else {
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
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa các sản phẩm đã chọn?",
    );
    if (!confirmDelete) return;
    try {
      await request(
        "DELETE",
        `${API_BASE}/api/admin/products/deleteProducts`,
        selectedProducts,
        "Xóa sản phẩm",
      );
      alert("Đã xóa thành công!");
      // Cập nhật lại danh sách sản phẩm sau khi xóa
      setProducts((prev) =>
        prev.filter((p) => !selectedProducts.includes(p.ProductID)),
      );
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
            <div className="category-nav">
              <button
                type="button"
                className="category-nav-arrow"
                onClick={() => scrollCategoryStrip(-1)}
                disabled={!canScrollLeft}
                title="Danh mục trước"
              >
                ◀
              </button>

              <div
                className="category-buttons"
                ref={categoryButtonsRef}
                onScroll={updateCategoryScrollState}
                onMouseDown={handleCategoryMouseDown}
                onMouseMove={handleCategoryMouseMove}
                onMouseUp={stopCategoryDragging}
                onMouseLeave={stopCategoryDragging}
                onTouchStart={handleCategoryTouchStart}
                onTouchMove={handleCategoryTouchMove}
                onTouchEnd={stopCategoryDragging}
              >
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
                      className={
                        selectedCategory === category.CategoryName ? "active" : ""
                      }
                      onClick={() => setSelectedCategory(category.CategoryName)}
                      style={{
                        transition: "opacity 0.4s ease, transform 0.4s ease",
                        transitionDelay: delay,
                        transform: showCategories
                          ? "translateX(0)"
                          : "translateX(-20px)",
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

              <button
                type="button"
                className="category-nav-arrow"
                onClick={() => scrollCategoryStrip(1)}
                disabled={!canScrollRight}
                title="Danh mục tiếp"
              >
                ▶
              </button>
            </div>
          )}
        </div>

        {/* 📦 Nội dung chính: thao tác & danh sách sản phẩm */}
        <div className={`product-content ${leftExpanded ? "open" : ""}`}>
          {/* 🛠 Sidebar thao tác & filter */}
          <div className="product-left">
            <button
              className="btn-add"
              onClick={handleAddProduct}
              title="Thêm sản phẩm"
              aria-label="Thêm sản phẩm"
            >
              <FaPlus />
            </button>
            <button
              className="btn-edit-save"
              onClick={handleEditOrSave}
              title={editMode ? "Lưu thay đổi" : "Chỉnh sửa đã chọn"}
              aria-label={editMode ? "Lưu thay đổi" : "Chỉnh sửa đã chọn"}
            >
              {editMode ? <FaSave /> : <FaEdit />}
            </button>
            <button
              className="btn-delete"
              onClick={handleDelete}
              title="Xóa đã chọn"
              aria-label="Xóa đã chọn"
            >
              <FaTrash />
            </button>
            <ExportProductsExcelButton
              products={products}
              className="btn-export"
              title="Xuất danh sách Excel"
              aria-label="Xuất danh sách Excel"
            >
              <FaFileExcel />
            </ExportProductsExcelButton>

            <button
              type="button"
              className="left-toggle-header"
              onClick={() => setLeftExpanded((prev) => !prev)}
              title={
                leftExpanded
                  ? "Thu gọn bảng điều khiển"
                  : "Mở rộng bảng điều khiển"
              }
              aria-label={
                leftExpanded
                  ? "Thu gọn bảng điều khiển"
                  : "Mở rộng bảng điều khiển"
              }
            >
              {leftExpanded ? <FaChevronLeft /> : <FaChevronRight />}
            </button>

            {leftExpanded && (
              <div className="overview-card" aria-label="Tổng quan nhanh">
                <div className="overview-item">
                  <div className="label">Tổng sản phẩm</div>
                  <div className="value">{overviewStats.totalProducts}</div>
                </div>
                <div className="overview-item">
                  <div className="label">Đang chọn</div>
                  <div className="value">{overviewStats.selectedCount}</div>
                </div>
                <div className="overview-item">
                  <div className="label">Tổng tồn kho</div>
                  <div className="value">{overviewStats.totalStock}</div>
                </div>
                <div className="overview-item">
                  <div className="label">Giá trung bình</div>
                  <div className="value">
                    {overviewStats.averagePrice.toLocaleString("vi-VN")}đ
                  </div>
                </div>
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
                    itemKey={(index, data) =>
                      data.filteredProducts[index]?.ProductID ?? index
                    }
                  >
                    {renderProductRow}
                  </List>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Outlet />{" "}
      {/* Thêm dòng này để hiển thị component con như AddProduct, ProductDetail */}
    </div>
  );
};

export const ProductOverview = React.memo(ProductOverviewComponent); // 🧩 Memo để tránh re-render không cần thiết
