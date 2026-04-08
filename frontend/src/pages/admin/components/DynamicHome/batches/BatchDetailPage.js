import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ToolBar from "../../ToolBar";
import { API_BASE, UPLOAD_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./batch-detail.scss";

const BatchDetailPage = () => {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const { request } = useHttp();

  const [loading, setLoading] = useState(false);
  const [batchMeta, setBatchMeta] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingAll, setIsEditingAll] = useState(false);
  const [productDraftMap, setProductDraftMap] = useState({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editCreatedAt, setEditCreatedAt] = useState("");
  const [newProductRows, setNewProductRows] = useState([]);
  const [activePickerRowId, setActivePickerRowId] = useState(null);

  const decodedBatchId = useMemo(
    () => decodeURIComponent(String(batchId || "")).trim(),
    [batchId],
  );

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
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const getDisplayStatus = (item) => {
    const quantity = Number(item?.Quantity || 0);
    const isActive = Number(item?.IsActive || 0) === 1;

    // Hết hàng: số lượng = 0 (bất kể active hay không)
    if (quantity === 0) {
      return "Hết hàng";
    }

    // Ngừng kinh doanh: active = false && có số lượng
    if (!isActive && quantity > 0) {
      return "Ngừng kinh doanh";
    }

    // Đang kinh doanh: active = true && có số lượng
    return "Đang kinh doanh";
  };

  const getRowKey = (item, index) => `${item?.ProductID || "P"}_${item?.Barcode || "B"}_${index}`;

  const getNormalized = (value) => String(value || "").trim().toLowerCase();

  const createEmptyNewRow = () => ({
    rowId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    productId: "",
    productName: "",
    productImage: "",
    barcode: "",
    quantity: "0",
    isActive: 1,
    expiryDate: "",
  });

  const resolveProductImage = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return `${UPLOAD_BASE}/pictures/no_image.jpg`;
    if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
    if (raw.startsWith("/")) return `${UPLOAD_BASE}${raw}`;
    return `${UPLOAD_BASE}/pictures/${raw}`;
  };

  const isProductVisible = (item) => {
    const value = item?.IsHidden ?? item?.isHidden;
    return (
      value === undefined ||
      value === null ||
      value === 0 ||
      value === "0" ||
      value === false ||
      String(value).toLowerCase() === "false"
    );
  };

  const displayedRows = useMemo(() => {
    const keyword = getNormalized(searchKeyword);
    return products
      .map((item, index) => ({ item, index, rowKey: getRowKey(item, index) }))
      .filter(({ item }) => {
        if (!keyword) return true;

        const productId = getNormalized(item?.ProductID);
        const productName = getNormalized(item?.ProductName);
        return productId.includes(keyword) || productName.includes(keyword);
      });
  }, [products, searchKeyword]);

  const filteredProductOptions = useMemo(() => {
    const keyword = getNormalized(searchKeyword);
    const visibleProducts = allProducts.filter((item) => isProductVisible(item));

    if (!keyword) return visibleProducts.slice(0, 120);

    return visibleProducts
      .filter((item) => {
        const pid = getNormalized(item?.ProductID || item?.id);
        const pname = getNormalized(item?.ProductName || item?.name);
        return pid.includes(keyword) || pname.includes(keyword);
      })
      .slice(0, 120);
  }, [allProducts, searchKeyword]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!decodedBatchId) {
        setBatchMeta(null);
        setProducts([]);
        return;
      }

      try {
        setLoading(true);

        const [batchesRes, productsRes, allProductsRes] = await Promise.all([
          request("GET", `${API_BASE}/api/admin/batches`),
          request("GET", `${API_BASE}/api/admin/batches/${encodeURIComponent(decodedBatchId)}/products`),
          request("GET", `${API_BASE}/api/user/products/loadAllProducts`),
        ]);

        const allBatches = Array.isArray(batchesRes?.data) ? batchesRes.data : [];
        const foundBatch = allBatches.find((item) => String(item?.ID || "").trim() === decodedBatchId);
        const resolvedBatch = foundBatch || { ID: decodedBatchId, CreatedAt: null, Note: "" };

        setBatchMeta(resolvedBatch);
        setEditNote(String(resolvedBatch?.Note || ""));
        setProducts(Array.isArray(productsRes?.data) ? productsRes.data : []);
        setAllProducts(Array.isArray(allProductsRes?.data) ? allProductsRes.data : []);
      } catch (error) {
        setBatchMeta({ ID: decodedBatchId, CreatedAt: null, Note: "" });
        setEditNote("");
        setProducts([]);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [decodedBatchId, request]);

  const handleDeleteBatch = async () => {
    const targetId = String(decodedBatchId || "").trim();
    if (!targetId) return;

    const ok = window.confirm(`Bạn có chắc muốn xóa lô "${targetId}"?`);
    if (!ok) return;

    try {
      setIsDeleting(true);
      const res = await request("DELETE", `${API_BASE}/api/admin/batches/${encodeURIComponent(targetId)}`);
      if (!res?.success) {
        window.alert(res?.message || "Không thể xóa lô hàng.");
        return;
      }

      navigate("..", { replace: true });
    } catch (error) {
      window.alert(error?.message || "Không thể xóa lô hàng.");
    } finally {
      setIsDeleting(false);
    }
  };

  const buildDraftMap = () => {
    const next = {};
    products.forEach((item, index) => {
      const rowKey = getRowKey(item, index);
      next[rowKey] = {
        productId: String(item?.ProductID || "").trim(),
        oldBarcode: String(item?.Barcode || "").trim(),
        barcode: String(item?.Barcode || "").trim(),
        quantity: String(Number(item?.Quantity || 0)),
        isActive: Number(item?.IsActive || 0) === 1 ? 1 : 0,
      };
    });
    return next;
  };

  const handleStartEditAll = () => {
    const currentNote = String(batchMeta?.Note || "").trim();
    const currentCreatedAt = batchMeta?.CreatedAt ? new Date(batchMeta.CreatedAt).toISOString().split('T')[0] : "";
    setEditNote(currentNote);
    setEditCreatedAt(currentCreatedAt);
    setProductDraftMap(buildDraftMap());
    setNewProductRows([createEmptyNewRow()]);
    setActivePickerRowId(null);
    setIsEditingAll(true);
  };

  const handleCancelEditAll = () => {
    setEditNote(String(batchMeta?.Note || "").trim());
    setEditCreatedAt('');
    setProductDraftMap({});
    setNewProductRows([]);
    setActivePickerRowId(null);
    setIsEditingAll(false);
  };

  const handleAddDraftInputRow = () => {
    setNewProductRows((prev) => [...prev, createEmptyNewRow()]);
    setActivePickerRowId(null);
  };

  const handleRemoveNewProductRow = (rowId) => {
    setNewProductRows((prev) => prev.filter((row) => row.rowId !== rowId));
    if (activePickerRowId === rowId) {
      setActivePickerRowId(null);
    }
  };

  const handleDraftChange = (rowKey, key, value) => {
    setProductDraftMap((prev) => ({
      ...prev,
      [rowKey]: {
        ...(prev[rowKey] || {}),
        [key]: value,
      },
    }));
  };

  const handleNewRowChange = (rowId, key, value) => {
    setNewProductRows((prev) => prev.map((row) => (
      row.rowId === rowId
        ? {
            ...row,
            [key]: value,
          }
        : row
    )));
  };

  const handleSelectProductForNewRow = (rowId, productId) => {
    const normalizedId = String(productId || "").trim();
    const found = allProducts.find(
      (item) => String(item?.ProductID || item?.id || "").trim() === normalizedId,
    );

    setNewProductRows((prev) => prev.map((row) => (
      row.rowId === rowId
        ? {
            ...row,
            productId: normalizedId,
            productName: String(found?.ProductName || found?.name || "").trim(),
            productImage: String(found?.Image || found?.image || "").trim(),
          }
        : row
    )));
    setActivePickerRowId(null);
  };

  const handleSaveAllEdits = async () => {
    const nextNote = String(editNote || "").trim();

    const changes = [];
    const creates = [];
    const toPairKey = (productId, barcode) => `${String(productId || "").trim().toLowerCase()}__${String(barcode || "").trim().toLowerCase()}`;
    const existingPairSet = new Set(
      products
        .map((item) => toPairKey(item?.ProductID, item?.Barcode))
        .filter((value) => value !== "__"),
    );
    const newPairSet = new Set();
    const nextProducts = products.map((item, index) => {
      const rowKey = getRowKey(item, index);
      const draft = productDraftMap[rowKey];
      if (!draft) return item;

      const payload = {
        productId: String(draft?.productId || "").trim(),
        oldBarcode: String(draft?.oldBarcode || "").trim(),
        newBarcode: String(draft?.barcode || "").trim(),
        quantity: Number(draft?.quantity || 0),
        isActive: Number(draft?.isActive || 0) === 1 ? 1 : 0,
      };

      if (!payload.productId || !payload.oldBarcode || !payload.newBarcode) {
        throw new Error("Vui lòng nhập đầy đủ ProductID và Barcode.");
      }

      if (Number.isNaN(payload.quantity) || payload.quantity < 0) {
        throw new Error("Số lượng không hợp lệ.");
      }

      const originalBarcode = String(item?.Barcode || "").trim();
      const originalQuantity = Number(item?.Quantity || 0);
      const originalIsActive = Number(item?.IsActive || 0) === 1 ? 1 : 0;

      const changed = (
        payload.newBarcode !== originalBarcode ||
        payload.quantity !== originalQuantity ||
        payload.isActive !== originalIsActive
      );

      if (changed) {
        changes.push(payload);
      }

      return {
        ...item,
        Barcode: payload.newBarcode,
        Quantity: payload.quantity,
        IsActive: payload.isActive,
      };
    });

    const preparedNewRows = [];
    for (const row of newProductRows) {
      const productId = String(row?.productId || "").trim();
      const barcode = String(row?.barcode || "").trim();
      const quantity = Number(row?.quantity || 0);
      const isActive = Number(row?.isActive || 0) === 1 ? 1 : 0;
      const isEmptyRow = !productId && !barcode;

      if (isEmptyRow) {
        continue;
      }

      if (!productId || !barcode) {
        throw new Error("Mỗi dòng thêm mới cần đủ sản phẩm và barcode.");
      }

      if (Number.isNaN(quantity) || quantity < 0) {
        throw new Error("Số lượng sản phẩm mới không hợp lệ.");
      }

      const pairKey = toPairKey(productId, barcode);
      if (existingPairSet.has(pairKey)) {
        throw new Error(`Sản phẩm ${productId} với barcode ${barcode} đã tồn tại trong lô hàng.`);
      }

      if (newPairSet.has(pairKey)) {
        throw new Error(`Danh sách thêm mới đang bị trùng sản phẩm ${productId} và barcode ${barcode}.`);
      }

      newPairSet.add(pairKey);
      preparedNewRows.push({
        batchId: decodedBatchId,
        productId,
        barcode,
        quantity,
        isActive,
        expiryDate: String(row?.expiryDate || "").trim(),
      });
    }

    for (const payload of preparedNewRows) {
      const check = await request("GET", `${API_BASE}/api/admin/products/checkProductExistence?productId=${encodeURIComponent(payload.productId)}`);
      if (!check?.exists || !check?.product?.id) {
        throw new Error(`Mã sản phẩm ${payload.productId} không tồn tại.`);
      }
      creates.push(payload);
    }

    if (changes.length === 0 && creates.length === 0) {
      const currentNote = String(batchMeta?.Note || "").trim();
      const batchChanged = nextNote !== currentNote;

      if (!batchChanged) {
        handleCancelEditAll();
        return;
      }
    }

    try {
      setIsSavingAll(true);
      for (const payload of creates) {
        const res = await request("POST", `${API_BASE}/api/admin/batches/${encodeURIComponent(decodedBatchId)}/products`, payload);
        if (!res?.success) {
          throw new Error(res?.message || "Không thể thêm sản phẩm vào lô.");
        }
      }

      for (const payload of changes) {
        const res = await request("PUT", `${API_BASE}/api/admin/batches/${encodeURIComponent(decodedBatchId)}/products`, payload);
        if (!res?.success) {
          throw new Error(res?.message || "Không thể cập nhật sản phẩm trong lô.");
        }
      }

      const batchRes = await request("PUT", `${API_BASE}/api/admin/batches/${encodeURIComponent(decodedBatchId)}`, {
        note: nextNote,
      });
      if (!batchRes?.success) {
        throw new Error(batchRes?.message || "Không thể cập nhật lô hàng.");
      }

      setProducts(nextProducts);

      setBatchMeta((prev) => ({
        ...(prev || {}),
        Note: nextNote,
      }));
      setNewProductRows([]);
      setActivePickerRowId(null);
      handleCancelEditAll();
    } catch (error) {
      window.alert(error?.message || "Không thể lưu chỉnh sửa.");
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleToggleEditAll = () => {
    if (isEditingAll) {
      handleSaveAllEdits();
      return;
    }
    handleStartEditAll();
  };

  return (
    <div className="lo-hang-detail-page">
      <ToolBar title="Chi tiết lô hàng" onSearchChange={() => {}} />

      <div className="lo-hang-detail-card">
        <div className="lo-hang-detail-actions">
          <button type="button" className="btn-back-lot" onClick={() => navigate("..")}>⬅ Quay lại</button>
          <div className="lo-hang-top-actions">
            <button
              type="button"
              className="btn-edit-all"
              onClick={handleToggleEditAll}
              disabled={loading || isDeleting || isSavingAll}
            >
              {isSavingAll ? "Đang lưu..." : isEditingAll ? "Lưu" : "Chỉnh sửa"}
            </button>
            {isEditingAll ? (
              <button
                type="button"
                className="btn-cancel-all"
                onClick={handleCancelEditAll}
                disabled={isSavingAll}
              >
                Hủy
              </button>
            ) : null}
            <button type="button" className="btn-delete-lot" onClick={handleDeleteBatch} disabled={isSavingAll || isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xóa lô hàng"}
            </button>
          </div>
        </div>

        <div className="lo-hang-detail-head">
          <h3>Thông tin lô hàng</h3>
        </div>

        <div className="lo-hang-detail-meta">
          <div className="meta-row">
            <span>Mã lô:</span>
            <strong>{batchMeta?.ID || decodedBatchId || "Chưa có"}</strong>
          </div>
          <div className="meta-row">
            <span>Ngày tạo:</span>
            {isEditingAll ? (
              <input
                className="meta-input"
                type="date"
                value={editCreatedAt}
                onChange={(e) => setEditCreatedAt(e.target.value)}
              />
            ) : (
              <strong>{formatDateOnly(batchMeta?.CreatedAt)}</strong>
            )}
          </div>
          <div className="meta-row"><span>Giờ tạo:</span><strong>{formatTimeOnly(batchMeta?.CreatedAt)}</strong></div>
          <div className="meta-row">
            <span>Ghi chú:</span>
            {isEditingAll ? (
              <input
                className="meta-input"
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            ) : (
              <strong>{batchMeta?.Note || "Không có ghi chú"}</strong>
            )}
          </div>
        </div>

        <div className="lo-hang-products-block">
          <div className="lo-hang-products-title-row">
            <div className="lo-hang-products-title">Tất cả sản phẩm thuộc lô này</div>
            <div className="lo-hang-products-controls">
              <input
                className="products-search-input"
                type="text"
                placeholder="Tìm theo mã hoặc tên sản phẩm..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                disabled={isSavingAll}
              />
            </div>
          </div>

          {isEditingAll ? (
            <>
              {newProductRows.map((newRow) => (
                <div className="add-product-row" key={newRow.rowId}>
                  <div className="product-picker">
                    <button
                      type="button"
                      className="product-picker__toggle"
                      onClick={() => setActivePickerRowId((prev) => (prev === newRow.rowId ? null : newRow.rowId))}
                    >
                      {newRow.productId ? (
                        <span className="product-picker__selected">
                          <img
                            src={resolveProductImage(newRow.productImage)}
                            alt={newRow.productName || "product"}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
                            }}
                          />
                          <span>
                            {newRow.productId} - {newRow.productName || "Sản phẩm"}
                          </span>
                        </span>
                      ) : (
                        "Chọn sản phẩm"
                      )}
                    </button>
                    {activePickerRowId === newRow.rowId && (
                      <div className="product-picker__menu">
                        {filteredProductOptions.length === 0 ? (
                          <div className="product-picker__empty">Không có sản phẩm phù hợp</div>
                        ) : (
                          filteredProductOptions.map((item) => {
                            const pid = String(item?.ProductID || item?.id || "").trim();
                            const pname = String(item?.ProductName || item?.name || "").trim();
                            return (
                              <button
                                key={`${newRow.rowId}_${pid}`}
                                type="button"
                                className="product-picker__option"
                                onClick={() => handleSelectProductForNewRow(newRow.rowId, pid)}
                              >
                                <img
                                  src={resolveProductImage(item?.Image || item?.image)}
                                  alt={pname || "product"}
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
                                  }}
                                />
                                <span>{pid} - {pname}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    className="add-product-row__input"
                    placeholder="Barcode"
                    value={newRow.barcode}
                    onChange={(e) => handleNewRowChange(newRow.rowId, "barcode", e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    className="add-product-row__input"
                    placeholder="Số lượng"
                    value={newRow.quantity}
                    onChange={(e) => handleNewRowChange(newRow.rowId, "quantity", e.target.value)}
                  />
                  <input
                    type="date"
                    className="add-product-row__input"
                    placeholder="Hạn sử dụng"
                    value={newRow.expiryDate}
                    onChange={(e) => handleNewRowChange(newRow.rowId, "expiryDate", e.target.value)}
                  />
                  <select
                    className="add-product-row__input"
                    value={String(newRow.isActive)}
                    onChange={(e) => handleNewRowChange(newRow.rowId, "isActive", Number(e.target.value))}
                    style={{
                      backgroundColor: Number(newRow.isActive) === 1 ? "#d1fae5" : "#fee2e2",
                    }}
                  >
                    <option value="1">Đang kinh doanh</option>
                    <option value="0">Ngừng kinh doanh</option>
                  </select>
                  <button
                    type="button"
                    className="add-product-row__delete"
                    onClick={() => handleRemoveNewProductRow(newRow.rowId)}
                    disabled={isSavingAll}
                    aria-label="Xóa dòng sản phẩm"
                    title="Xóa dòng sản phẩm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="add-product-actions">
                <button
                  type="button"
                  className="add-product-row__button add-product-row__button--small"
                  onClick={handleAddDraftInputRow}
                  disabled={isSavingAll}
                  aria-label="Bấm để thêm sản phẩm"
                  title="Bấm để thêm sản phẩm"
                >
                  +
                </button>
              </div>
            </>
          ) : null}

          {loading ? (
            <div className="lo-hang-empty">Đang tải dữ liệu...</div>
          ) : displayedRows.length === 0 ? (
            <div className="lo-hang-empty">
              {products.length === 0 ? "Lô hàng này chưa có sản phẩm." : "Không tìm thấy sản phẩm phù hợp."}
            </div>
          ) : (
            <div className="lo-hang-products-wrap">
              <table className="lo-hang-products-table">
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>Mã sản phẩm</th>
                    <th>Tên sản phẩm</th>
                    <th>Barcode</th>
                    <th>Số lượng</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map(({ item, index, rowKey }) => {
                    const draft = productDraftMap[rowKey] || {
                      productId: String(item?.ProductID || "").trim(),
                      oldBarcode: String(item?.Barcode || "").trim(),
                      barcode: String(item?.Barcode || "").trim(),
                      quantity: String(Number(item?.Quantity || 0)),
                      isActive: Number(item?.IsActive || 0) === 1 ? 1 : 0,
                    };

                    return (
                    <tr key={rowKey}>
                      <td>
                        <img
                          className="batch-product-thumb"
                          src={resolveProductImage(item?.Image || item?.image)}
                          alt={item?.ProductName || "product"}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
                          }}
                        />
                      </td>
                      <td>{item?.ProductID || ""}</td>
                      <td>{item?.ProductName || ""}</td>
                      <td>
                        {isEditingAll ? (
                          <input
                            className="inline-input"
                            type="text"
                            value={draft.barcode}
                            onChange={(e) => handleDraftChange(rowKey, "barcode", e.target.value)}
                          />
                        ) : (
                          item?.Barcode || ""
                        )}
                      </td>
                      <td>
                        {isEditingAll ? (
                          <input
                            className="inline-input"
                            type="number"
                            min="0"
                            value={draft.quantity}
                            onChange={(e) => handleDraftChange(rowKey, "quantity", e.target.value)}
                          />
                        ) : (
                          Number(item?.Quantity || 0)
                        )}
                      </td>
                      <td>
                        {isEditingAll ? (
                          <select
                            className="inline-select"
                            value={String(draft.isActive)}
                            onChange={(e) => handleDraftChange(rowKey, "isActive", Number(e.target.value))}
                            style={{
                              backgroundColor: Number(draft.isActive) === 1 ? "#d1fae5" : "#fee2e2",
                            }}
                          >
                            <option value="1">Đang kinh doanh</option>
                            <option value="0">Ngừng kinh doanh</option>
                          </select>
                        ) : (
                          getDisplayStatus(item)
                        )}
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchDetailPage;
