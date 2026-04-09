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
  const [pendingCategoryByProduct, setPendingCategoryByProduct] = useState({});
  const [pendingSubCategoryByProduct, setPendingSubCategoryByProduct] = useState({});
  const tableWrapperRef = useRef(null);
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
        console.error("Lỗi tải danh mục con:", err);
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
      console.error("Lỗi cập nhật danh mục con:", err);
    } finally {
      setUpdating(false);
    }
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
          <div className="category-products-title">Sản phẩm theo danh mục</div>
          <div className="category-products-subtitle">{categoryName}</div>
        </div>

        <div className="category-products-header-right">
          <span className="category-products-count">{filteredProducts.length} sản phẩm</span>
          <button
            type="button"
            className="btn-refresh-category-products"
            onClick={handleUpdateSubCategories}
            disabled={loading || updating}
          >
            {updating ? "Đang cập nhật..." : "Cập nhật"}
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
                <th>Danh mục con</th>
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
