import { useEffect, useState } from "react";
import useHttp from "../../../hooks/useHttp";
import { API_BASE } from "../../../constants";
import { useAuth } from "../context/AuthContext";
import "./orders_page.scss";

const OrdersPage = () => {
  const { request, loading } = useHttp();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setError("");
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Vui lòng đăng nhập để xem đơn hàng.");
        return;
      }

      try {
        const res = await request("GET", `${API_BASE}/api/user/orders`, null, {
          Authorization: `Bearer ${token}`,
        });

        if (res?.success) {
          setOrders(res.data || []);
        } else {
          setError(res?.message || "Không thể tải đơn hàng.");
        }
      } catch (err) {
        setError(err?.message || "Lỗi khi tải đơn hàng.");
      }
    };

    fetchOrders();
  }, [request, user]);

  const openOrderDetail = async (orderId) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await request("GET", `${API_BASE}/api/user/orders/detail/${encodeURIComponent(orderId)}` , null, {
        Authorization: `Bearer ${token}`,
      });
      if (res?.success) setSelectedOrder(res.order || null);
    } catch (err) {
      setError(err?.message || "Không thể tải chi tiết đơn hàng.");
    }
  };

  return (
    <section className="order-page">
      <div className="page-header">
        <h1>Đơn hàng của tôi</h1>
      </div>

      {loading && <p>Đang tải...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p className="no-orders">Bạn chưa có đơn hàng nào.</p>
      )}

      {!loading && orders.length > 0 && (
        <div className="order-list">
          <div className="header-row">
            <ul className="header-columns">
              <li className="column">Mã đơn</li>
              <li className="column">Tổng</li>
              <li className="column">Trạng thái</li>
              <li className="column">Ngày</li>
              <li className="column">Hành động</li>
            </ul>
          </div>

          <div className="orders-body">
            {orders.map((o) => (
              <div key={o.id} className="order-row">
                <div className="col">{o.id}</div>
                <div className="col">{Number(o.total).toLocaleString()} đ</div>
                <div className="col">{o.status}</div>
                <div className="col">{new Date(o.createdAt).toLocaleString()}</div>
                <div className="col">
                  <button type="button" onClick={() => openOrderDetail(o.id)}>
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="order-detail-popup" onClick={() => setSelectedOrder(null)}>
          <div className="popup-body" onClick={(e) => e.stopPropagation()}>
            <h3>Chi tiết đơn {selectedOrder.id}</h3>
            <p>Trạng thái: {selectedOrder.status}</p>
            <p>Tổng: {Number(selectedOrder.total).toLocaleString()} đ</p>
            <div className="items">
              <h4>Sản phẩm</h4>
              <ul>
                {(selectedOrder.items || []).map((it, idx) => (
                  <li key={idx}>{it.ProductName || it.name} x{it.quantity || it.Quantity} - {Number(it.lineTotal || it.LineTotal || it.price || it.salePrice || 0).toLocaleString()} đ</li>
                ))}
              </ul>
            </div>
            <button type="button" onClick={() => setSelectedOrder(null)}>Đóng</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default OrdersPage;
