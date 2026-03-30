import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ToolBar from "../../ToolBar";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./batch-detail.scss";

const BatchDetailPage = () => {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const { request } = useHttp();

  const [loading, setLoading] = useState(false);
  const [batchMeta, setBatchMeta] = useState(null);
  const [products, setProducts] = useState([]);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingAll, setIsEditingAll] = useState(false);
  const [productDraftMap, setProductDraftMap] = useState({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const [editBatchId, setEditBatchId] = useState("");
  const [editNote, setEditNote] = useState("");

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

  useEffect(() => {
    const loadDetail = async () => {
      if (!decodedBatchId) {
        setBatchMeta(null);
        setProducts([]);
        return;
      }

      try {
        setLoading(true);

        const [batchesRes, productsRes] = await Promise.all([
          request("GET", `${API_BASE}/api/admin/batches`),
          request("GET", `${API_BASE}/api/admin/batches/${encodeURIComponent(decodedBatchId)}/products`),
        ]);

        const allBatches = Array.isArray(batchesRes?.data) ? batchesRes.data : [];
        const foundBatch = allBatches.find((item) => String(item?.ID || "").trim() === decodedBatchId);
        const resolvedBatch = foundBatch || { ID: decodedBatchId, CreatedAt: null, Note: "" };

        setBatchMeta(resolvedBatch);
        setEditBatchId(String(resolvedBatch?.ID || ""));
        setEditNote(String(resolvedBatch?.Note || ""));
        setProducts(Array.isArray(productsRes?.data) ? productsRes.data : []);
      } catch (error) {
        setBatchMeta({ ID: decodedBatchId, CreatedAt: null, Note: "" });
        setEditBatchId(decodedBatchId);
        setEditNote("");
        setProducts([]);
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
    const currentBatchId = String(batchMeta?.ID || decodedBatchId || "").trim();
    const currentNote = String(batchMeta?.Note || "").trim();
    setEditBatchId(currentBatchId);
    setEditNote(currentNote);
    setProductDraftMap(buildDraftMap());
    setIsEditingAll(true);
  };

  const handleCancelEditAll = () => {
    setEditBatchId(String(batchMeta?.ID || decodedBatchId || "").trim());
    setEditNote(String(batchMeta?.Note || "").trim());
    setProductDraftMap({});
    setIsEditingAll(false);
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

  const handleSaveAllEdits = async () => {
    const nextBatchId = String(editBatchId || "").trim();
    const nextNote = String(editNote || "").trim();

    if (!nextBatchId) {
      window.alert("Mã lô hàng không được để trống.");
      return;
    }

    const changes = [];
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

    if (changes.length === 0) {
      const currentBatchId = String(batchMeta?.ID || decodedBatchId || "").trim();
      const currentNote = String(batchMeta?.Note || "").trim();
      const batchChanged = nextBatchId !== currentBatchId || nextNote !== currentNote;

      if (!batchChanged) {
        handleCancelEditAll();
        return;
      }
    }

    try {
      setIsSavingAll(true);
      for (const payload of changes) {
        const res = await request("PUT", `${API_BASE}/api/admin/batches/${encodeURIComponent(decodedBatchId)}/products`, payload);
        if (!res?.success) {
          throw new Error(res?.message || "Không thể cập nhật sản phẩm trong lô.");
        }
      }

      const batchRes = await request("PUT", `${API_BASE}/api/admin/batches/${encodeURIComponent(decodedBatchId)}`, {
        newBatchId: nextBatchId,
        note: nextNote,
      });
      if (!batchRes?.success) {
        throw new Error(batchRes?.message || "Không thể cập nhật lô hàng.");
      }

      setProducts(nextProducts);

      if (nextBatchId !== decodedBatchId) {
        navigate(`../${encodeURIComponent(nextBatchId)}`, { replace: true });
        return;
      }

      setBatchMeta((prev) => ({
        ...(prev || {}),
        ID: nextBatchId,
        Note: nextNote,
      }));
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
            {isEditingAll ? (
              <input
                className="meta-input"
                type="text"
                value={editBatchId}
                onChange={(e) => setEditBatchId(e.target.value)}
              />
            ) : (
              <strong>{batchMeta?.ID || decodedBatchId || "Chưa có"}</strong>
            )}
          </div>
          <div className="meta-row"><span>Ngày tạo:</span><strong>{formatDateOnly(batchMeta?.CreatedAt)}</strong></div>
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
