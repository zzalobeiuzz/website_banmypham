import React, { useMemo, useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ToolBar from "../../ToolBar";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./batches.scss";

const BatchesPage = () => {
  const navigate = useNavigate();
  const { request } = useHttp();
  const [keyword, setKeyword] = useState("");
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formBatchId, setFormBatchId] = useState("");
  const [formNote, setFormNote] = useState("");

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
  };

  const handleCreate = async () => {
    const batchId = String(formBatchId || "").trim();
    const note = String(formNote || "").trim();

    if (!batchId) {
      window.alert("Vui lòng nhập mã lô hàng.");
      return;
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

      await reloadBatches();
      resetForm();
    } catch (error) {
      window.alert(error?.message || "Không thể lưu lô hàng.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLots = useMemo(() => {
    const k = String(keyword || "").trim().toLowerCase();
    if (!k) return lots;

    return lots.filter((lot) => {
      const id = String(lot.ID || "").toLowerCase();
      const note = String(lot.Note || "").toLowerCase();
      return id.includes(k) || note.includes(k);
    });
  }, [keyword, lots]);

  return (
    <div className="lo-hang-page">
      <ToolBar title="Lô hàng" onSearchChange={setKeyword} />

      <div className="lo-hang-card">
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
          <div className="lo-hang-form__actions">
            <button type="button" className="btn-save-lot" onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Tạo lô"}
            </button>
          </div>
        </div>

        <div className="lo-hang-head">
          <span>{filteredLots.length} lô hàng</span>
        </div>

        {loading ? (
          <div className="lo-hang-empty">Đang tải dữ liệu lô hàng...</div>
        ) : filteredLots.length === 0 ? (
          <div className="lo-hang-empty">Không có lô hàng phù hợp.</div>
        ) : (
          <div className="lo-hang-table-wrap">
            <table className="lo-hang-table">
              <thead>
                <tr>
                  <th>Mã lô</th>
                  <th>Ngày tạo</th>
                  <th>Giờ tạo</th>
                  <th>Ghi chú</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.map((lot) => (
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
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchesPage;
