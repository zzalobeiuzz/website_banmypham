import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import ToolBar from "../../ToolBar";
import "./category.scss";

const CategoryPage = () => {
  const { request } = useHttp();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [openedCategoryId, setOpenedCategoryId] = useState(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingSubForCategoryId, setAddingSubForCategoryId] = useState(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [saving, setSaving] = useState(false);
  const [centerNotice, setCenterNotice] = useState({
    open: false,
    title: "Thong bao",
    message: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    categoryId: "",
    categoryName: "",
  });
  const [deleteWarning, setDeleteWarning] = useState({
    open: false,
    categoryId: "",
    categoryName: "",
    productCount: 0,
  });
  const [deleteSubCategoryConfirm, setDeleteSubCategoryConfirm] = useState({
    open: false,
    subCategoryId: "",
    subCategoryName: "",
  });
  const [deleteSubCategoryWarning, setDeleteSubCategoryWarning] = useState({
    open: false,
    subCategoryId: "",
    subCategoryName: "",
    productCount: 0,
  });
  const navigate = useNavigate();

  const showCenterNotice = (message, title = "Thong bao") => {
    setCenterNotice({
      open: true,
      title: String(title || "Thong bao"),
      message: String(message || "Có lỗi xảy ra"),
    });
  };

  const loadData = useCallback(async () => {
    const categoryPromise = request("GET", `${API_BASE}/api/admin/categories`)
      .then((catRes) => {
        setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
      })
      .catch((error) => {
        console.error("Lỗi tải danh mục:", error);
        setCategories([]);
      });

    const productPromise = request("GET", `${API_BASE}/api/user/products/loadAllProducts`)
      .then((prodRes) => {
        setProducts(Array.isArray(prodRes?.data) ? prodRes.data : []);
      })
      .catch((error) => {
        console.error("Lỗi tải sản phẩm:", error);
        setProducts([]);
      });

    await Promise.allSettled([categoryPromise, productPromise]);
  }, [request]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadData();
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [loadData]);

  const countsByCategory = useMemo(() => {
    const map = {};
    for (const p of products) {
      const key = p.CategoryName || "(Không có)";
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [products]);

  const countsBySubCategory = useMemo(() => {
    const map = {};
    for (const p of products) {
      const key = p.SubCategoryID || "";
      if (!key) {
        continue;
      }
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [products]);

  const filteredCategories = useMemo(() => {
    const visibleCategories = categories
      .filter((category) => Number(category?.IsHidden || 0) !== 1)
      .map((category) => ({
        ...category,
        SubCategories: Array.isArray(category?.SubCategories)
          ? category.SubCategories.filter((sub) => Number(sub?.IsHidden || 0) !== 1)
          : [],
      }));

    const keyword = String(searchKeyword || "").trim().toLowerCase();
    if (!keyword) {
      return visibleCategories;
    }

    return visibleCategories.filter((category) => {
      const categoryName = String(category?.CategoryName || "").toLowerCase();
      const subNames = Array.isArray(category?.SubCategories)
        ? category.SubCategories.map((sub) => String(sub?.SubCategoryName || "").toLowerCase())
        : [];

      return categoryName.includes(keyword) || subNames.some((name) => name.includes(keyword));
    });
  }, [categories, searchKeyword]);

  const toggleCategory = (categoryId) => {
    setOpenedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleCategoryCardClick = (event, categoryId) => {
    const clickedInteractiveElement = event.target.closest(
      "button, input, textarea, select, a, .subcategory-panel",
    );

    if (clickedInteractiveElement) {
      return;
    }

    toggleCategory(categoryId);
  };

  const handleCreateCategory = async () => {
    const normalizedName = String(newCategoryName || "").trim();
    if (!normalizedName) {
      showCenterNotice("Vui lòng nhập tên danh mục mới", "Thông báo");
      return;
    }

    try {
      setSaving(true);
      await request("POST", `${API_BASE}/api/admin/categories/add`, {
        categoryName: normalizedName,
      });
      setNewCategoryName("");
      setCreatingCategory(false);
      await loadData();
    } catch (err) {
      showCenterNotice(err?.message || "Không thể tạo danh mục mới", "Không thể tạo");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubCategory = async (categoryId) => {
    const normalizedName = String(newSubCategoryName || "").trim();
    if (!normalizedName) {
      showCenterNotice("Vui lòng nhập tên danh mục con", "Thông báo");
      return;
    }

    try {
      setSaving(true);
      await request("POST", `${API_BASE}/api/admin/categories/sub/add`, {
        categoryId,
        subCategoryName: normalizedName,
      });
      setNewSubCategoryName("");
      setAddingSubForCategoryId(null);
      await loadData();
    } catch (err) {
      showCenterNotice(err?.message || "Không thể tạo danh mục con", "Không thể tạo");
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteCategory = (categoryId, categoryName) => {
    const productCount = Number(countsByCategory[categoryName] || 0);

    // Lúc nào cũng mở dialog xác nhận (có hoặc không có sản phẩm)
    // Nếu có sản phẩm thì alert trước, sau đó mở confirm dialog
    if (productCount > 0) {
      setDeleteWarning({
        open: true,
        categoryId,
        categoryName,
        productCount,
      });
    } else {
      // Nếu không có sản phẩm, mở confirm dialog luôn
      setDeleteConfirm({
        open: true,
        categoryId,
        categoryName,
      });
    }
  };

  const handleWarningConfirm = () => {
    // User đã xác nhận cảnh báo, giờ hiển thị dialog confirm thứ 2
    setDeleteWarning({ open: false, categoryId: "", categoryName: "", productCount: 0 });
    setDeleteConfirm({
      open: true,
      categoryId: deleteWarning.categoryId,
      categoryName: deleteWarning.categoryName,
    });
  };

  const handleWarningCancel = () => {
    setDeleteWarning({ open: false, categoryId: "", categoryName: "", productCount: 0 });
  };

  const handleDeleteCategory = async () => {
    const categoryId = deleteConfirm.categoryId;
    const categoryName = deleteConfirm.categoryName;

    if (!categoryId) {
      return;
    }

    // Dong modal confirm truoc khi goi API de tranh chong backdrop
    setDeleteConfirm({ open: false, categoryId: "", categoryName: "" });

    try {
      setSaving(true);
      await request("DELETE", `${API_BASE}/api/admin/categories/${encodeURIComponent(categoryId)}`);
      if (openedCategoryId === categoryId) {
        setOpenedCategoryId(null);
      }
      await loadData();
      showCenterNotice(`Xóa danh mục "${categoryName}" thành công`, "Thành công");
    } catch (err) {
      showCenterNotice(err?.message || "Không thể xóa danh mục", "Không thể xóa");
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteSubCategory = (subCategoryId, subCategoryName) => {
    const productCount = Number(countsBySubCategory[subCategoryId] || 0);

    // Lúc nào cũng mở dialog xác nhận (có hoặc không có sản phẩm)
    // Nếu có sản phẩm thì alert trước, sau đó mở confirm dialog
    if (productCount > 0) {
      setDeleteSubCategoryWarning({
        open: true,
        subCategoryId,
        subCategoryName,
        productCount,
      });
    } else {
      // Nếu không có sản phẩm, mở confirm dialog luôn
      setDeleteSubCategoryConfirm({
        open: true,
        subCategoryId,
        subCategoryName,
      });
    }
  };

  const handleSubCategoryWarningConfirm = () => {
    // User đã xác nhận cảnh báo, giờ hiển thị dialog confirm thứ 2
    setDeleteSubCategoryWarning({ open: false, subCategoryId: "", subCategoryName: "", productCount: 0 });
    setDeleteSubCategoryConfirm({
      open: true,
      subCategoryId: deleteSubCategoryWarning.subCategoryId,
      subCategoryName: deleteSubCategoryWarning.subCategoryName,
    });
  };

  const handleSubCategoryWarningCancel = () => {
    setDeleteSubCategoryWarning({ open: false, subCategoryId: "", subCategoryName: "", productCount: 0 });
  };

  const handleDeleteSubCategory = async () => {
    const subCategoryId = deleteSubCategoryConfirm.subCategoryId;
    const subCategoryName = deleteSubCategoryConfirm.subCategoryName;

    if (!subCategoryId) {
      return;
    }

    // Dong modal confirm truoc khi goi API de tranh chong backdrop
    setDeleteSubCategoryConfirm({ open: false, subCategoryId: "", subCategoryName: "" });

    try {
      setSaving(true);
      await request("DELETE", `${API_BASE}/api/admin/categories/sub/${encodeURIComponent(subCategoryId)}`);
      await loadData();
      showCenterNotice(`Xoa danh muc con "${subCategoryName}" thanh cong`, "Thanh cong");
    } catch (err) {
      showCenterNotice(err?.message || "Khong the xoa danh muc con", "Khong the xoa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="category-page">
      <ToolBar title="Danh mục hàng hóa" onSearchChange={setSearchKeyword} />
      <div className="category-grid">
        <button
          type="button"
          className="category-card category-card--add"
          onClick={() => setCreatingCategory(true)}
        >
          <span className="add-plus">+</span>
          <span className="add-label">Thêm danh mục mới</span>
        </button>

        {filteredCategories.map((c) => (
          <div
            key={c.CategoryID}
            className="category-card"
            onClick={(event) => handleCategoryCardClick(event, c.CategoryID)}
          >
            <button
              type="button"
              className="btn-delete-category-corner"
              title="Xóa danh mục"
              disabled={saving}
              onClick={() => requestDeleteCategory(c.CategoryID, c.CategoryName)}
            >
              -
            </button>

            <button
              className="category-header"
              type="button"
              onClick={() => toggleCategory(c.CategoryID)}
            >
              <div className="category-name">{c.CategoryName}</div>
              <div className="category-meta">
                <span className="category-subcount">
                  {Array.isArray(c.SubCategories) ? c.SubCategories.length : 0} danh mục con
                </span>
                <div className="category-meta-right">
                  <span className="category-product-count">{countsByCategory[c.CategoryName] || 0} sản phẩm</span>
                  <span className={`category-chevron ${openedCategoryId === c.CategoryID ? "open" : ""}`}>
                    ▾
                  </span>
                </div>
              </div>
            </button>

            {openedCategoryId === c.CategoryID && (
              <div className="subcategory-panel">
                <div className="subcategory-header-row">
                  <div className="subcategory-title">Danh mục con</div>
                  <button
                    type="button"
                    className="btn-add-subcategory"
                    title="Thêm danh mục con"
                    onClick={() => {
                      setAddingSubForCategoryId(c.CategoryID);
                      setNewSubCategoryName("");
                    }}
                  >
                    +
                  </button>
                </div>

                {addingSubForCategoryId === c.CategoryID && (
                  <div className="subcategory-create-row">
                    <input
                      type="text"
                      value={newSubCategoryName}
                      onChange={(e) => setNewSubCategoryName(e.target.value)}
                      placeholder="Nhập tên danh mục con"
                    />
                    <button type="button" onClick={() => handleCreateSubCategory(c.CategoryID)} disabled={saving}>
                      {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                    <button
                      type="button"
                      className="btn-cancel-sub"
                      onClick={() => {
                        setAddingSubForCategoryId(null);
                        setNewSubCategoryName("");
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                )}

                {Array.isArray(c.SubCategories) && c.SubCategories.length > 0 ? (
                  <table className="subcategory-table">
                    <thead>
                      <tr>
                        <th>Tên danh mục con</th>
                        <th>Số sản phẩm</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.SubCategories.map((sub) => (
                        <tr key={sub.SubCategoryID}>
                          <td>{sub.SubCategoryName}</td>
                          <td>{countsBySubCategory[sub.SubCategoryID] || 0}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-delete-subcategory"
                              title="Xóa danh mục con"
                              disabled={saving}
                              onClick={() => requestDeleteSubCategory(sub.SubCategoryID, sub.SubCategoryName)}
                            >
                              -
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="subcategory-empty">Danh mục này chưa có danh mục con.</div>
                )}
              </div>
            )}

            <div className="category-actions">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/admin/product/categories/${encodeURIComponent(c.CategoryID)}/products?name=${encodeURIComponent(c.CategoryName)}`,
                  )
                }
              >
                Xem sản phẩm
              </button>
            </div>
          </div>
        ))}
      </div>

      {creatingCategory && (
        <div className="category-modal-backdrop" onClick={() => setCreatingCategory(false)}>
          <div className="category-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Tạo danh mục mới</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nhập tên danh mục"
            />
            <div className="category-modal-actions">
              <button type="button" onClick={() => setCreatingCategory(false)}>
                Hủy
              </button>
              <button type="button" onClick={handleCreateCategory} disabled={saving}>
                {saving ? "Đang lưu..." : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {centerNotice.open && (
        <div
          className="center-notice-backdrop"
          onClick={() => setCenterNotice({ open: false, title: "Thong bao", message: "" })}
        >
          <div className="center-notice" onClick={(e) => e.stopPropagation()}>
            <div className="center-notice-title">{centerNotice.title}</div>
            <div className="center-notice-message">{centerNotice.message}</div>
            <div className="center-notice-actions">
              <button
                type="button"
                onClick={() => setCenterNotice({ open: false, title: "Thong bao", message: "" })}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteWarning.open && (
        <div
          className="center-notice-backdrop"
          onClick={handleWarningCancel}
        >
          <div className="center-notice" onClick={(e) => e.stopPropagation()}>
            <div className="center-notice-title">⚠️ Cảnh báo</div>
            <div className="center-notice-message">
              Danh mục "{deleteWarning.categoryName}" đang có <strong>{deleteWarning.productCount}</strong> sản phẩm. Bạn vẫn muốn xóa?
            </div>
            <div className="center-notice-actions">
              <button
                type="button"
                className="btn-cancel-notice"
                onClick={handleWarningCancel}
              >
                Hủy
              </button>
              <button type="button" onClick={handleWarningConfirm}>
                Tiếp tục xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm.open && (
        <div
          className="center-notice-backdrop"
          onClick={() => setDeleteConfirm({ open: false, categoryId: "", categoryName: "" })}
        >
          <div className="center-notice" onClick={(e) => e.stopPropagation()}>
            <div className="center-notice-title">Xác nhận xóa danh mục</div>
            <div className="center-notice-message">
              Bạn có chắc muốn xóa danh mục "{deleteConfirm.categoryName}"? <strong>Thao tác này không thể hoàn tác.</strong>
            </div>
            <div className="center-notice-actions">
              <button
                type="button"
                className="btn-cancel-notice"
                onClick={() => setDeleteConfirm({ open: false, categoryId: "", categoryName: "" })}
              >
                Hủy
              </button>
              <button type="button" onClick={handleDeleteCategory} disabled={saving}>
                {saving ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSubCategoryWarning.open && (
        <div
          className="center-notice-backdrop"
          onClick={handleSubCategoryWarningCancel}
        >
          <div className="center-notice" onClick={(e) => e.stopPropagation()}>
            <div className="center-notice-title">⚠️ Cảnh báo</div>
            <div className="center-notice-message">
              Danh mục con "{deleteSubCategoryWarning.subCategoryName}" đang có <strong>{deleteSubCategoryWarning.productCount}</strong> sản phẩm. Bạn vẫn muốn xóa?
            </div>
            <div className="center-notice-actions">
              <button
                type="button"
                className="btn-cancel-notice"
                onClick={handleSubCategoryWarningCancel}
              >
                Hủy
              </button>
              <button type="button" onClick={handleSubCategoryWarningConfirm}>
                Tiếp tục xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSubCategoryConfirm.open && (
        <div
          className="center-notice-backdrop"
          onClick={() => setDeleteSubCategoryConfirm({ open: false, subCategoryId: "", subCategoryName: "" })}
        >
          <div className="center-notice" onClick={(e) => e.stopPropagation()}>
            <div className="center-notice-title">Xác nhận xóa danh mục con</div>
            <div className="center-notice-message">
              Bạn có chắc muốn xóa danh mục con "{deleteSubCategoryConfirm.subCategoryName}"? <strong>Thao tác này không thể hoàn tác.</strong>
            </div>
            <div className="center-notice-actions">
              <button
                type="button"
                className="btn-cancel-notice"
                onClick={() => setDeleteSubCategoryConfirm({ open: false, subCategoryId: "", subCategoryName: "" })}
              >
                Hủy
              </button>
              <button type="button" onClick={handleDeleteSubCategory} disabled={saving}>
                {saving ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
