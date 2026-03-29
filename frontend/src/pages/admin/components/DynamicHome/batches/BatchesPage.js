import React, { useMemo, useState } from "react";
import { useEffect } from "react";
import ToolBar from "../../ToolBar";
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import "./batches.scss";

const BatchesPage = () => {
  const { request } = useHttp();
  const [keyword, setKeyword] = useState("");
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);

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
        <div className="lo-hang-head">
          <h3>Danh sách lô hàng</h3>
          <span>{filteredLots.length} lô</span>
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
                  <th>ID</th>
                  <th>CreatedAt</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.map((lot) => (
                  <tr key={lot.ID}>
                    <td>{lot.ID}</td>
                    <td>{lot.CreatedAt ? new Date(lot.CreatedAt).toLocaleString("vi-VN") : ""}</td>
                    <td>{lot.Note || ""}</td>
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
