import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import useMinimumLoading from "../../useMinimumLoading";
import "./categoryProducts.scss";

const CategoryProductsPage = () => {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { request } = useHttp();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const showLoading = useMinimumLoading(loading, 500);
  const [updating, setUpdating] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [addProductKeyword, setAddProductKeyword] = useState("");
  const [selectedProductIdsToAdd, setSelectedProductIdsToAdd] = useState([]);
  const [selectedSubCategoryToAdd, setSelectedSubCategoryToAdd] = useState("");
  const [isAddProductDropdownOpen, setIsAddProductDropdownOpen] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [pendingCategoryByProduct, setPendingCategoryByProduct] = useState({});
  const [pendingSubCategoryByProduct, setPendingSubCategoryByProduct] = useState({});
  const tableWrapperRef = useRef(null);
  const addProductDropdownRef = useRef(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });

  const categoryName = searchParams.get("name") || "Danh mục";

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await request("GET", `${API_BASE}/api/user/products/loadAllProducts`);
      setProducts(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải sản phẩm theo danh mục:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/admin/categories`);
        const allCategories = Array.isArray(res?.data) ? res.data : [];
        const visibleCategories = allCategories.filter((cat) => Number(cat?.IsHidden || 0) !== 1);

        setCategories(visibleCategories);

      } catch (err) {
        console.error("Lỗi tải phân loại:", err);
      }
    };

    fetchCategoryData();
  }, [request, categoryId]);

  const filteredProducts = useMemo(() => {
    const keyword = String(searchKeyword || "").trim().toLowerCase();

    return products
      .filter((p) => String(p?.CategoryID || "") === String(categoryId || ""))
      .filter((p) => {
        if (!keyword) return true;

        const productId = String(p?.ProductID || "").toLowerCase();
        const productName = String(p?.ProductName || "").toLowerCase();
        return productId.includes(keyword) || productName.includes(keyword);
      })
      .sort((a, b) => String(a?.ProductName || "").localeCompare(String(b?.ProductName || "")));
  }, [products, categoryId, searchKeyword]);

  const subCategoriesByCategory = useMemo(() => {
    const map = {};
    for (const cat of categories) {
      map[cat.CategoryID] = Array.isArray(cat?.SubCategories)
        ? cat.SubCategories.filter((sub) => Number(sub?.IsHidden || 0) !== 1)
        : [];
    }
    return map;
  }, [categories]);

  const currentCategory = useMemo(
    () => categories.find((cat) => String(cat?.CategoryID || "") === String(categoryId || "")) || null,
    [categories, categoryId],
  );

  const currentSubCategories = useMemo(
    () => subCategoriesByCategory[categoryId] || [],
    [subCategoriesByCategory, categoryId],
  );

  const categoryNameById = useMemo(() => {
    const map = {};
    for (const category of categories) {
      map[String(category?.CategoryID || "")] = category?.CategoryName || "";
    }
    return map;
  }, [categories]);

  const subCategoryNameById = useMemo(() => {
    const map = {};
    for (const category of categories) {
      for (const subCategory of category?.SubCategories || []) {
        map[String(subCategory?.SubCategoryID || "")] = subCategory?.SubCategoryName || "";
      }
    }
    return map;
  }, [categories]);

  const baseAddableProducts = useMemo(() => (
    products
      .filter((product) => String(product?.CategoryID || "") !== String(categoryId || ""))
      .filter((product) => Number(product?.IsHidden || 0) !== 1)
      .sort((a, b) => String(a?.ProductName || "").localeCompare(String(b?.ProductName || "")))
  ), [products, categoryId]);

  const addableProducts = useMemo(() => {
    const keyword = String(addProductKeyword || "").trim().toLowerCase();

    return baseAddableProducts
      .filter((product) => {
        if (!keyword) return true;
        const productId = String(product?.ProductID || "").toLowerCase();
        const productName = String(product?.ProductName || "").toLowerCase();
        return productId.includes(keyword) || productName.includes(keyword);
      });
  }, [baseAddableProducts, addProductKeyword]);

  const selectedProductsToAdd = useMemo(
    () => selectedProductIdsToAdd
      .map((productId) => products.find((product) => String(product?.ProductID || "") === String(productId)))
      .filter(Boolean),
    [products, selectedProductIdsToAdd],
  );

  useEffect(() => {
    if (selectedProductIdsToAdd.length === 0) return;

    const availableIds = new Set(baseAddableProducts.map((product) => String(product?.ProductID || "")));
    const nextSelectedIds = selectedProductIdsToAdd.filter((productId) => availableIds.has(String(productId)));

    if (nextSelectedIds.length !== selectedProductIdsToAdd.length) {
      setSelectedProductIdsToAdd(nextSelectedIds);
    }

    if (nextSelectedIds.length === 0) {
      setSelectedSubCategoryToAdd("");
    }
  }, [baseAddableProducts, selectedProductIdsToAdd]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!addProductDropdownRef.current || addProductDropdownRef.current.contains(event.target)) return;
      setIsAddProductDropdownOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleChangeCategory = (product, nextCategoryId) => {
    const productId = product.ProductID;
    setPendingCategoryByProduct((prev) => ({
      ...prev,
      [productId]: nextCategoryId,
    }));

    const validSubIds = (subCategoriesByCategory[nextCategoryId] || []).map((sub) =>
      String(sub.SubCategoryID || ""),
    );
    const currentSub =
      pendingSubCategoryByProduct[productId] !== undefined
        ? pendingSubCategoryByProduct[productId]
        : product.SubCategoryID || "";

    if (!validSubIds.includes(String(currentSub || ""))) {
      setPendingSubCategoryByProduct((prev) => ({
        ...prev,
        [productId]: "",
      }));
    }
  };

  const handleChangeSubCategory = (productId, value) => {
    setPendingSubCategoryByProduct((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const handleUpdateSubCategories = async () => {
    const changedProducts = filteredProducts
      .map((product) => {
        const nextCategoryId =
          pendingCategoryByProduct[product.ProductID] !== undefined
            ? pendingCategoryByProduct[product.ProductID]
            : product.CategoryID || "";
        const nextSubId =
          pendingSubCategoryByProduct[product.ProductID] !== undefined
            ? pendingSubCategoryByProduct[product.ProductID]
            : product.SubCategoryID || "";

        return {
          ProductID: product.ProductID,
          currentCategory: String(product.CategoryID || ""),
          nextCategory: String(nextCategoryId || ""),
          currentSub: String(product.SubCategoryID || ""),
          nextSub: String(nextSubId || ""),
        };
      })
      .filter((item) => item.currentCategory !== item.nextCategory || item.currentSub !== item.nextSub)
      .map((item) => ({
        ProductID: item.ProductID,
        CategoryID: item.nextCategory || null,
        SubCategoryID: item.nextSub || null,
      }));

    if (changedProducts.length === 0) {
      return;
    }

    try {
      setUpdating(true);
      await request("PUT", `${API_BASE}/api/admin/products/updateProducts`, changedProducts);
      await loadProducts();
      setPendingCategoryByProduct({});
      setPendingSubCategoryByProduct({});
    } catch (err) {
      console.error("Lỗi cập nhật phân loại:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddProductToCategory = async () => {
    const productIds = selectedProductIdsToAdd.map((productId) => String(productId || "").trim()).filter(Boolean);
    if (productIds.length === 0 || !categoryId || addingProduct) return;

    try {
      setAddingProduct(true);
      await request(
        "PUT",
        `${API_BASE}/api/admin/products/updateProducts`,
        productIds.map((productId) => ({
          ProductID: productId,
          CategoryID: categoryId,
          SubCategoryID: selectedSubCategoryToAdd || null,
        })),
      );
      await loadProducts();
      setSelectedProductIdsToAdd([]);
      setSelectedSubCategoryToAdd("");
      setAddProductKeyword("");
      setIsAddProductDropdownOpen(false);
    } catch (err) {
      console.error("Lỗi thêm sản phẩm vào danh mục:", err);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleToggleProductToAdd = (productId) => {
    const normalizedProductId = String(productId || "").trim();
    if (!normalizedProductId) return;

    setSelectedProductIdsToAdd((prev) => (
      prev.includes(normalizedProductId)
        ? prev.filter((item) => item !== normalizedProductId)
        : [...prev, normalizedProductId]
    ));
  };

  const handleRemoveSelectedProduct = (productId) => {
    setSelectedProductIdsToAdd((prev) => prev.filter((item) => item !== String(productId || "")));
  };

  const handleTableMouseDown = (event) => {
    const tableEl = tableWrapperRef.current;
    if (!tableEl) return;

    const clickedInteractive = event.target.closest(
      "button, input, select, textarea, a, option",
    );
    if (clickedInteractive) return;

    dragStateRef.current = {
      isDragging: true,
      startX: event.pageX,
      scrollLeft: tableEl.scrollLeft,
    };

    tableEl.classList.add("is-dragging");
  };

  const handleTableMouseMove = (event) => {
    const tableEl = tableWrapperRef.current;
    if (!tableEl || !dragStateRef.current.isDragging) return;

    event.preventDefault();
    const walk = (event.pageX - dragStateRef.current.startX) * 1.15;
    tableEl.scrollLeft = dragStateRef.current.scrollLeft - walk;
  };

  const stopTableDragging = () => {
    const tableEl = tableWrapperRef.current;
    dragStateRef.current.isDragging = false;
    tableEl?.classList.remove("is-dragging");
  };

  const handleTableTouchStart = (event) => {
    const tableEl = tableWrapperRef.current;
    if (!tableEl) return;

    dragStateRef.current = {
      isDragging: true,
      startX: event.touches[0].pageX,
      scrollLeft: tableEl.scrollLeft,
    };
  };

  const handleTableTouchMove = (event) => {
    const tableEl = tableWrapperRef.current;
    if (!tableEl || !dragStateRef.current.isDragging) return;

    const walk = (event.touches[0].pageX - dragStateRef.current.startX) * 1.05;
    tableEl.scrollLeft = dragStateRef.current.scrollLeft - walk;
  };

  return (
    <div className="category-products-page">
      <div className="category-products-header">
        <div>
          <div className="category-products-title">Sản phẩm trong danh mục</div>
          <div className="category-products-subtitle">{categoryName}</div>
        </div>

        <div className="category-products-header-right">
          <span className="category-products-count">{filteredProducts.length} sản phẩm</span>
          <button
            type="button"
            className="btn-open-add-category-products"
            onClick={() => setIsAddPanelOpen((prev) => !prev)}
          >
            {isAddPanelOpen ? "Thu gọn" : "+ Thêm sản phẩm"}
          </button>
          <button
            type="button"
            className="btn-refresh-category-products"
            onClick={handleUpdateSubCategories}
            disabled={loading || updating}
          >
            {updating ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            className="btn-close-category-products"
            onClick={() => navigate("/admin/product/categories")}
          >
            Đóng
          </button>
        </div>
      </div>

      <div className="category-products-search-row">
        <input
          type="text"
          className="category-products-search-input"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Tìm theo mã sản phẩm hoặc tên sản phẩm"
        />
      </div>

      {isAddPanelOpen && (
        <div className="category-products-add-panel">
          <div className="category-products-add-panel__heading">
            <div>
              <h3>Thêm sản phẩm vào danh mục</h3>
              <p>{currentCategory?.CategoryName || categoryName}</p>
            </div>
            <span>{addableProducts.length} sản phẩm có thể thêm</span>
          </div>

          <div className="category-products-add-grid">
            <div className="category-products-add-field category-products-add-field--wide">
              <span>Chọn sản phẩm</span>
              <div
                className={`category-products-multi-select ${isAddProductDropdownOpen ? "is-open" : ""}`}
                ref={addProductDropdownRef}
              >
                <button
                  type="button"
                  className="category-products-multi-select__button"
                  onClick={() => setIsAddProductDropdownOpen((prev) => !prev)}
                >
                  <span>
                    {selectedProductIdsToAdd.length > 0
                      ? `Đã chọn ${selectedProductIdsToAdd.length} sản phẩm`
                      : "Tìm và chọn sản phẩm"}
                  </span>
                  <b>⌄</b>
                </button>

                {isAddProductDropdownOpen && (
                  <div className="category-products-multi-select__menu">
                    <input
                      type="text"
                      value={addProductKeyword}
                      onChange={(event) => setAddProductKeyword(event.target.value)}
                      placeholder="Nhập mã hoặc tên sản phẩm"
                      autoFocus
                    />

                    <div className="category-products-multi-select__list">
                      {addableProducts.slice(0, 100).map((product) => {
                        const productId = String(product?.ProductID || "");
                        const isSelected = selectedProductIdsToAdd.includes(productId);
                        const productCategoryName = categoryNameById[String(product?.CategoryID || "")] || "Chưa có";
                        const productSubCategoryName =
                          subCategoryNameById[String(product?.SubCategoryID || "")] || "Chưa có";

                        return (
                          <button
                            type="button"
                            key={productId}
                            className={`category-products-multi-select__option ${isSelected ? "is-selected" : ""}`}
                            onClick={() => handleToggleProductToAdd(productId)}
                          >
                            <span className="category-products-option-check">{isSelected ? "✓" : ""}</span>
                            <img
                              src={`${UPLOAD_BASE}/pictures/${product.Image}`}
                              alt={product.ProductName}
                              onError={(event) => {
                                event.target.onerror = null;
                                event.target.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
                              }}
                            />
                            <span className="category-products-option-main">
                              <strong>{product.ProductID}</strong>
                              <em>{product.ProductName}</em>
                            </span>
                            <span className="category-products-option-meta">
                              <small>Danh mục hiện tại</small>
                              <b>{productCategoryName}</b>
                            </span>
                            <span className="category-products-option-meta">
                              <small>Phân loại hiện tại</small>
                              <b>{productSubCategoryName}</b>
                            </span>
                          </button>
                        );
                      })}

                      {addableProducts.length === 0 && (
                        <div className="category-products-multi-select__empty">
                          Không có sản phẩm phù hợp để thêm.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedProductsToAdd.length > 0 && (
                <div className="category-products-selected-list">
                  {selectedProductsToAdd.map((product) => (
                    <button
                      type="button"
                      key={product.ProductID}
                      onClick={() => handleRemoveSelectedProduct(product.ProductID)}
                    >
                      {product.ProductID} - {product.ProductName}
                      <span>×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="category-products-add-field">
              <span>Phân loại mới</span>
              <select
                value={selectedSubCategoryToAdd}
                onChange={(event) => setSelectedSubCategoryToAdd(event.target.value)}
              >
                <option value="">Không có</option>
                {currentSubCategories.map((sub) => (
                  <option key={sub.SubCategoryID} value={sub.SubCategoryID}>
                    {sub.SubCategoryName}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="btn-add-product-to-category"
              onClick={handleAddProductToCategory}
              disabled={selectedProductIdsToAdd.length === 0 || addingProduct}
            >
              {addingProduct ? "Đang thêm..." : `Thêm ${selectedProductIdsToAdd.length || ""}`.trim()}
            </button>
          </div>
        </div>
      )}

      {showLoading ? (
        <AdminLoadingScreen message="Đang tải dữ liệu..." compact />
      ) : filteredProducts.length === 0 ? (
        <div className="category-products-empty">
          {searchKeyword
            ? "Không tìm thấy sản phẩm phù hợp với từ khóa."
            : "Không có sản phẩm nào thuộc danh mục này."}
        </div>
      ) : (
        <>
          <div
            className="category-products-table-wrapper"
            ref={tableWrapperRef}
            onMouseDown={handleTableMouseDown}
            onMouseMove={handleTableMouseMove}
            onMouseUp={stopTableDragging}
            onMouseLeave={stopTableDragging}
            onTouchStart={handleTableTouchStart}
            onTouchMove={handleTableTouchMove}
            onTouchEnd={stopTableDragging}
          >
          <table className="category-products-table">
            <thead>
              <tr>
                <th>Mã sản phẩm</th>
                <th>Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Phân loại</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.ProductID}>
                  {(() => {
                    const selectedCategoryId =
                      pendingCategoryByProduct[product.ProductID] !== undefined
                        ? pendingCategoryByProduct[product.ProductID]
                        : product.CategoryID || "";
                    const availableSubCategories = subCategoriesByCategory[selectedCategoryId] || [];

                    return (
                      <>
                  <td>{product.ProductID}</td>
                  <td>
                    <img
                      src={`${UPLOAD_BASE}/pictures/${product.Image}`}
                      alt={product.ProductName}
                      className="category-products-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
                      }}
                    />
                  </td>
                  <td>{product.ProductName}</td>
                  <td>
                    <select
                      className="category-products-cat-select"
                      value={selectedCategoryId}
                      onChange={(e) => handleChangeCategory(product, e.target.value)}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat.CategoryID} value={cat.CategoryID}>
                          {cat.CategoryName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="category-products-sub-select"
                      value={
                        pendingSubCategoryByProduct[product.ProductID] !== undefined
                          ? pendingSubCategoryByProduct[product.ProductID]
                          : product.SubCategoryID || ""
                      }
                      onChange={(e) => handleChangeSubCategory(product.ProductID, e.target.value)}
                    >
                      <option value="">Không có</option>
                      {availableSubCategories.map((sub) => (
                        <option key={sub.SubCategoryID} value={sub.SubCategoryID}>
                          {sub.SubCategoryName}
                        </option>
                      ))}
                    </select>
                  </td>
                      </>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryProductsPage;
