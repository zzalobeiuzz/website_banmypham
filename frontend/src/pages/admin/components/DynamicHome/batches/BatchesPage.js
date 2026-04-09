import React, { useMemo, useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ToolBar from "../../ToolBar";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import AdminLoadingScreen from "../../shared/AdminLoadingScreen";
import useMinimumLoading from "../../useMinimumLoading";
import "./batches.scss";

const generateAutoBarcode = (batchId, productId) => {
  const cleanBatch = String(batchId || "").trim().replace(/\s+/g, "").toUpperCase() || "BATCH";
  const timeSeed = Date.now().toString().slice(-8);
  const randomSeed = Math.floor(Math.random() * 900 + 100);
  return `${cleanBatch}-${timeSeed}${randomSeed}`;
};

const resolveProductImageUrl = (imageValue) => {
  const raw = String(imageValue || "").trim();
  if (!raw) return `${UPLOAD_BASE}/pictures/default.jpg`;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:image/")) return raw;
  if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
  return `${UPLOAD_BASE}/pictures/${raw}`;
};

const BatchesPage = () => {
  const navigate = useNavigate();
  const { request } = useHttp();
  const [keyword, setKeyword] = useState("");
  const [lots, setLots] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const showLoading = useMinimumLoading(loading, 500);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingLotId, setDeletingLotId] = useState("");
  const [createdDateFilter, setCreatedDateFilter] = useState("");
  const [createdDateSort, setCreatedDateSort] = useState("desc");
  const [isShowForm, setIsShowForm] = useState(false);
  const [formBatchId, setFormBatchId] = useState("");
  const [formNote, setFormNote] = useState("");
  const [productsToAdd, setProductsToAdd] = useState([]);
  const [productSearchFilter, setProductSearchFilter] = useState("");
  const [filteredProductsList, setFilteredProductsList] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const formatDateOnly = (value) => {
    if (!value) return "Chưa có";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Chưa có";
    return date.toLocaleDateString("vi-VN");
  };

  const formatTimeOnly = (value) => {
    if (!value) return "Chưa có";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Chưa có";
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const toDateKey = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoading(true);
        const res = await request("GET", `${API_BASE}/api/admin/batches`);
        setLots(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        console.error("Lỗi tải lô hàng:", error);
        setLots([]);
      } finally {
        setLoading(false);
      }
    };

    loadBatches();
  }, [request]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/user/products/loadAllProducts`);
        const rows = Array.isArray(res?.data) ? res.data : [];
        setAvailableProducts(rows);
      } catch (error) {
        console.error("Lỗi tải danh sách sản phẩm:", error);
        setAvailableProducts([]);
      }
    };

    loadProducts();
  }, [request]);

  useEffect(() => {
    const keyword = String(productSearchFilter || "").trim().toLowerCase();
    if (!keyword) {
      setFilteredProductsList(availableProducts);
    } else {
      const filtered = availableProducts.filter((p) => {
        const pid = String(p?.ProductID || "").toLowerCase();
        const pname = String(p?.ProductName || "").toLowerCase();
        return pid.includes(keyword) || pname.includes(keyword);
      });
      setFilteredProductsList(filtered);
    }
  }, [productSearchFilter, availableProducts]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const searchWrapper = document.querySelector(".lo-hang-form__search-wrapper");
      if (searchWrapper && !searchWrapper.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };

    if (showSearchDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showSearchDropdown]);

  const reloadBatches = async () => {
    try {
      setLoading(true);
      const res = await request("GET", `${API_BASE}/api/admin/batches`);
      setLots(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      setLots([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormBatchId("");
    setFormNote("");
    setProductsToAdd([]);
    setProductSearchFilter("");
    setIsShowForm(false);
  };

  const addProductRow = () => {
    const newRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      productId: "",
      barcode: "",
      quantity: 1,
      barcodeMode: "auto",
    };
    setProductsToAdd((prev) => [...prev, newRow]);
  };

  const removeProductRow = (rowId) => {
    setProductsToAdd((prev) => prev.filter((row) => row.id !== rowId));
  };

  const updateProductRow = (rowId, field, value) => {
    setProductsToAdd((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        if (field === "productId") {
          const autoBarcode = generateAutoBarcode(formBatchId, value);
          return { ...row, productId: value, barcode: autoBarcode };
        }

        if (field === "barcodeMode") {
          return { ...row, barcodeMode: value, barcode: "" };
        }

        return { ...row, [field]: value };
      })
    );
  };

  const getProductById = (productId) =>
    availableProducts.find((p) => String(p?.ProductID || "") === String(productId || ""));

  const handleCreate = async () => {
    const batchId = String(formBatchId || "").trim();
    const note = String(formNote || "").trim();

    if (!batchId) {
      window.alert("Vui lòng nhập mã lô hàng.");
      return;
    }

    if (productsToAdd.length > 0) {
      const invalidRow = productsToAdd.find((row) => {
        const productId = String(row?.productId || "").trim();
        const barcode = String(row?.barcode || "").trim();
        const quantity = Number(row?.quantity || 0);

        if (!productId) return true;
        if (!barcode) return true;
        if (!Number.isFinite(quantity) || quantity <= 0) return true;
        return false;
      });

      if (invalidRow) {
        window.alert("Vui lòng kiểm tra: sản phẩm, barcode, số lượng của tất cả hàng thêm.");
        return;
      }
    }

    try {
      setIsSaving(true);

      const res = await request("POST", `${API_BASE}/api/admin/batches`, {
        batchId,
        note,
      });
      if (!res?.success) {
        window.alert(res?.message || "Không thể tạo lô hàng.");
        return;
      }

      for (const row of productsToAdd) {
        const addRes = await request(
          "POST",
          `${API_BASE}/api/admin/batches/${encodeURIComponent(batchId)}/products`,
          {
            productId: String(row.productId || "").trim(),
            barcode: String(row.barcode || "").trim(),
            quantity: Number(row.quantity || 0),
            isActive: true,
          }
        );

        if (!addRes?.success) {
          console.error(`Chưa thêm được sản phẩm ${row.productId}:`, addRes?.message);
        }
      }

      await reloadBatches();
      resetForm();
      setIsShowForm(false);
    } catch (error) {
      window.alert(error?.message || "Không thể lưu lô hàng.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelForm = () => {
    resetForm();
  };

  const handleSelectProductFromSearch = (product) => {
    const newRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      productId: String(product?.ProductID || ""),
      barcode: generateAutoBarcode(formBatchId, String(product?.ProductID || "")),
      quantity: 1,
      barcodeMode: "auto",
    };
    setProductsToAdd((prev) => [...prev, newRow]);
    setProductSearchFilter("");
    setShowSearchDropdown(false);
  };

  const handleDeleteFromList = async (lotId) => {
    const targetId = String(lotId || "").trim();
    if (!targetId) return;

    const ok = window.confirm(`Bạn có chắc muốn xóa lô "${targetId}"?`);
    if (!ok) return;

    try {
      setDeletingLotId(targetId);
      const res = await request("DELETE", `${API_BASE}/api/admin/batches/${encodeURIComponent(targetId)}`);
      if (!res?.success) {
        window.alert(res?.message || "Không thể xóa lô hàng.");
        return;
      }

      // Ẩn ngay lô vừa xóa khỏi danh sách hiện tại
      setLots((prev) => prev.filter((lot) => String(lot?.ID || "").trim() !== targetId));
    } catch (error) {
      window.alert(error?.message || "Không thể xóa lô hàng.");
    } finally {
      setDeletingLotId("");
    }
  };

  const filteredLots = useMemo(() => {
    const k = String(keyword || "").trim().toLowerCase();
    let nextLots = Array.isArray(lots) ? [...lots] : [];

    if (k) {
      nextLots = nextLots.filter((lot) => {
        const id = String(lot.ID || "").toLowerCase();
        const note = String(lot.Note || "").toLowerCase();
        return id.includes(k) || note.includes(k);
      });
    }

    if (createdDateFilter) {
      nextLots = nextLots.filter((lot) => toDateKey(lot?.CreatedAt) === createdDateFilter);
    }

    nextLots.sort((a, b) => {
      const aTime = new Date(a?.CreatedAt || 0).getTime();
      const bTime = new Date(b?.CreatedAt || 0).getTime();
      if (createdDateSort === "asc") {
        return aTime - bTime;
      }
      return bTime - aTime;
    });

    return nextLots;
  }, [keyword, lots, createdDateFilter, createdDateSort]);

  return (
    <div className="lo-hang-page">
      <ToolBar title="Lô hàng" onSearchChange={setKeyword} />

      <div className="lo-hang-card">
        {!isShowForm && (
          <div className="lo-hang-form-toggle">
            <button
              type="button"
              className="btn-create-lot-main"
              onClick={() => setIsShowForm(true)}
            >
              ➕ Tạo lô hàng mới
            </button>
          </div>
        )}

        {isShowForm && (
        <div className="lo-hang-form">
          <div className="lo-hang-form__title">Tạo lô hàng mới</div>
          <div className="lo-hang-form__grid">
            <div className="lo-hang-form__field">
              <label>Mã lô hàng</label>
              <input
                type="text"
                value={formBatchId}
                onChange={(e) => setFormBatchId(e.target.value)}
                placeholder="Nhập mã lô"
              />
            </div>
            <div className="lo-hang-form__field lo-hang-form__field--wide">
              <label>Ghi chú</label>
              <input
                type="text"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="Nhập ghi chú"
              />
            </div>
          </div>

          <div className="lo-hang-form__subtitle">Thêm sản phẩm có sẵn vào lô (tùy chọn)</div>

          {/* Bộ lọc sản phẩm */}
          <div className="lo-hang-form__filter">
            <div className="lo-hang-form__search-wrapper">
              <input
                type="text"
                placeholder="Tìm sản phẩm theo ID hoặc tên để thêm..."
                value={productSearchFilter}
                onChange={(e) => setProductSearchFilter(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                className="lo-hang-form__search-input"
              />
              {showSearchDropdown && productSearchFilter.trim() && filteredProductsList.length > 0 && (
                <div className="lo-hang-form__search-dropdown">
                  {filteredProductsList.map((product) => {
                    const pid = String(product?.ProductID || "");
                    const pname = String(product?.ProductName || "");
                    const imageUrl = resolveProductImageUrl(product?.Image);
                    return (
                      <div
                        key={pid}
                        className="lo-hang-form__search-item"
                        onClick={() => handleSelectProductFromSearch(product)}
                      >
                        <img
                          className="lo-hang-form__search-item__image"
                          src={imageUrl}
                          alt={pname || pid}
                        />
                        <div className="lo-hang-form__search-item__id">{pid}</div>
                        <div className="lo-hang-form__search-item__name">{pname}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Danh sách sản phẩm thêm */}
          <div className="lo-hang-form__products-list">
            {productsToAdd.map((row, idx) => (
              <div key={row.id} className="product-row">
                <div className="product-row__index">{idx + 1}</div>

                <div className="product-row__field product-row__field--product">
                  <label>Sản phẩm</label>
                  {row.productId && (
                    <div className="product-row__preview">
                      <img
                        src={resolveProductImageUrl(getProductById(row.productId)?.Image)}
                        alt={String(getProductById(row.productId)?.ProductName || row.productId)}
                      />
                    </div>
                  )}
                  <select
                    value={row.productId}
                    onChange={(e) => updateProductRow(row.id, "productId", e.target.value)}
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {filteredProductsList.map((product) => {
                      const pid = String(product?.ProductID || "");
                      const pname = String(product?.ProductName || "");
                      return (
                        <option key={pid} value={pid}>
                          {pid} - {pname || "Không có tên"}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="product-row__field product-row__field--qty">
                  <label>Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) => updateProductRow(row.id, "quantity", e.target.value)}
                  />
                </div>

                <div className="product-row__field product-row__field--barcode">
                  <label>Barcode</label>
                  <div className="barcode-select">
                    <select
                      value={row.barcodeMode}
                      onChange={(e) => updateProductRow(row.id, "barcodeMode", e.target.value)}
                    >
                      <option value="auto">Tự tạo</option>
                      <option value="manual">Tự nhập</option>
                    </select>
                  </div>
                </div>

                <div className="product-row__field product-row__field--barcode-input">
                  {row.barcodeMode === "manual" ? (
                    <input
                      type="text"
                      value={row.barcode}
                      onChange={(e) => updateProductRow(row.id, "barcode", e.target.value)}
                      placeholder="Nhập barcode"
                    />
                  ) : (
                    <input
                      type="text"
                      value={row.barcode}
                      readOnly
                      placeholder="Barcode tự tạo"
                    />
                  )}
                </div>

                <button
                  type="button"
                  className="product-row__btn-remove"
                  onClick={() => removeProductRow(row.id)}
                  title="Xóa hàng"
                >
                  ✖
                </button>
              </div>
            ))}
          </div>

          {/* Nút thêm hàng sản phẩm */}
          {productsToAdd.length < filteredProductsList.length && (
            <button
              type="button"
              className="btn-add-product-row"
              onClick={addProductRow}
            >
              ➕ Thêm sản phẩm
            </button>
          )}

          <div className="lo-hang-form__footer">
            <div className="lo-hang-form__actions">
              <button type="button" className="btn-save-lot" onClick={handleCreate} disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Tạo lô"}
              </button>
              <button type="button" className="btn-cancel-lot" onClick={handleCancelForm}>
                Hủy
              </button>
            </div>
            <div className="lo-hang-form__count">
              <span>{filteredLots.length} lô hàng</span>
            </div>
          </div>
        </div>
        )}

        {showLoading ? (
          <AdminLoadingScreen message="Đang tải dữ liệu lô hàng..." />
        ) : (
          <div className="lo-hang-table-wrap">
            <table className="lo-hang-table">
              <thead>
                <tr>
                  <th>Mã lô</th>
                  <th>
                    <div className="th-date-tools">
                      <span>Ngày tạo</span>
                      <input
                        type="date"
                        value={createdDateFilter}
                        onChange={(e) => setCreatedDateFilter(e.target.value)}
                        className="th-date-input"
                        title="Lọc theo ngày tạo"
                      />
                      <select
                        value={createdDateSort}
                        onChange={(e) => setCreatedDateSort(e.target.value)}
                        className="th-date-sort"
                        title="Sắp xếp theo ngày tạo"
                      >
                        <option value="desc">Mới nhất</option>
                        <option value="asc">Cũ nhất</option>
                      </select>
                    </div>
                  </th>
                  <th>Giờ tạo</th>
                  <th>Ghi chú</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="lo-hang-empty-row">Không có lô hàng phù hợp.</td>
                  </tr>
                ) : (
                  filteredLots.map((lot) => (
                    <tr key={lot.ID}>
                      <td>{lot.ID}</td>
                      <td>{formatDateOnly(lot.CreatedAt)}</td>
                      <td>{formatTimeOnly(lot.CreatedAt)}</td>
                      <td>{lot.Note || "Không có ghi chú"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-view-lot"
                          onClick={() => navigate(`${encodeURIComponent(String(lot.ID || ""))}`)}
                          disabled={deletingLotId === String(lot.ID || "")}
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          className="btn-delete-lot-row"
                          onClick={() => handleDeleteFromList(lot.ID)}
                          disabled={deletingLotId === String(lot.ID || "")}
                        >
                          {deletingLotId === String(lot.ID || "") ? "Đang xóa..." : "Xóa"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchesPage;
