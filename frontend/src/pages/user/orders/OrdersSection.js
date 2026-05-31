import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import { useAuth } from "../context/AuthContext";
import "./orders_section.scss";

const resolveProductImageSrc = (image) => {
  const value = String(image || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  const normalized = value
    .replace(/^\/+/, "")
    .replace(/^uploads\/?assets\/?pictures\/?/i, "")
    .replace(/^pictures\/?/i, "");

  return `${UPLOAD_BASE}/pictures/${normalized}`;
};

const formatPaymentMethod = (method) => {
  const value = String(method || "")
    .trim()
    .toUpperCase();

  switch (value) {
    case "COD":
      return "Thanh toán khi nhận hàng";
    case "MOMO":
      return "Thanh toán ví MoMo";
    case "TRANSFER":
      return "Chuyển khoản ngân hàng";
    default:
      return method || "-";
  }
};

const OrdersSection = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [orderSearchKeyword, setOrderSearchKeyword] = useState("");
  const [amountSortOrder, setAmountSortOrder] = useState("asc");
  const [dateSortOrder, setDateSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const didFetchOrdersRef = useRef(false);
  const { user } = useAuth();
  const { request } = useHttp();

  useEffect(() => {
    if (didFetchOrdersRef.current || !user?.id) return;

    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setOrdersError("Vui lòng đăng nhập để xem đơn hàng.");
        setOrdersLoading(false);
        return;
      }

      try {
        const res = await request("GET", `${API_BASE}/api/user/orders`, null, {
          Authorization: `Bearer ${token}`,
        });

        if (res?.success) {
          setOrders(res.orders || res.data || []);
          didFetchOrdersRef.current = true;
        } else {
          setOrdersError(res?.message || "Không thể tải đơn hàng.");
        }
      } catch (err) {
        setOrdersError(err?.message || "Lỗi khi tải đơn hàng.");
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [request, user?.id]);

  const statusOptions = useMemo(() => {
    const uniqueStatuses = new Set(
      (Array.isArray(orders) ? orders : [])
        .map((order) => String(order?.status || "").trim())
        .filter(Boolean),
    );
    return ["all", ...Array.from(uniqueStatuses)];
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const keyword = String(orderSearchKeyword || "")
      .trim()
      .toLowerCase();
    const selectedStatus = String(statusFilter || "all").trim();

    let next = Array.isArray(orders) ? [...orders] : [];

    if (selectedStatus !== "all") {
      next = next.filter(
        (order) => String(order?.status || "").trim() === selectedStatus,
      );
    }

    if (keyword) {
      next = next.filter((order) =>
        String(order?.id || "")
          .toLowerCase()
          .includes(keyword),
      );
    }

    next.sort((a, b) => {
      const totalA = Number(a?.total) || 0;
      const totalB = Number(b?.total) || 0;
      const timeA = new Date(a?.createdAt || 0).getTime() || 0;
      const timeB = new Date(b?.createdAt || 0).getTime() || 0;

      const amountCompare =
        amountSortOrder === "asc" ? totalA - totalB : totalB - totalA;
      if (amountCompare !== 0) return amountCompare;

      return dateSortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    return next;
  }, [orders, orderSearchKeyword, amountSortOrder, dateSortOrder, statusFilter]);

  const openOrderDetail = async (orderId) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      setOrderDetailLoading(true);
      setSelectedOrder(null);
      const res = await request(
        "GET",
        `${API_BASE}/api/user/orders/detail/${encodeURIComponent(orderId)}`,
        null,
        {
          Authorization: `Bearer ${token}`,
        },
      );

      if (res?.success) setSelectedOrder(res.order || null);
    } catch (err) {
      setOrdersError(err?.message || "Không thể tải chi tiết đơn hàng.");
    } finally {
      setOrderDetailLoading(false);
    }
  };

  return (
    <section className="profile-orders-section">
      <div className="orders-toolbar">
        <input
          type="text"
          className="orders-search-input"
          placeholder="Tìm theo mã đơn hàng..."
          value={orderSearchKeyword}
          onChange={(e) => setOrderSearchKeyword(e.target.value)}
        />
        <div className="orders-filter-group">
          <label className="orders-filter-label">Số tiền</label>
          <select
            className="orders-filter-select"
            value={amountSortOrder}
            onChange={(e) => setAmountSortOrder(e.target.value)}
          >
            <option value="asc">Thấp → Cao</option>
            <option value="desc">Cao → Thấp</option>
          </select>
        </div>
        <div className="orders-filter-group">
          <label className="orders-filter-label">Ngày</label>
          <select
            className="orders-filter-select"
            value={dateSortOrder}
            onChange={(e) => setDateSortOrder(e.target.value)}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
        <div className="orders-filter-group">
          <label className="orders-filter-label">Trạng thái</label>
          <select
            className="orders-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "Tất cả" : status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {ordersLoading && <p>Đang tải...</p>}
      {ordersError && <p className="error">{ordersError}</p>}
      {!ordersLoading && !ordersError && orders.length === 0 && (
        <p className="no-orders">Bạn chưa có đơn hàng nào.</p>
      )}
      {!ordersLoading &&
        !ordersError &&
        orders.length > 0 &&
        visibleOrders.length === 0 && (
          <p className="no-orders">Không tìm thấy đơn hàng phù hợp.</p>
        )}
      {!ordersLoading && visibleOrders.length > 0 && (
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
            {visibleOrders.map((o) => (
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

      {(orderDetailLoading || selectedOrder) && (
        <div
          className="order-detail-popup"
          onClick={() => {
            setSelectedOrder(null);
            setOrderDetailLoading(false);
          }}
        >
          <div className="popup-body" onClick={(e) => e.stopPropagation()}>
            {orderDetailLoading && <p>Đang tải chi tiết đơn hàng...</p>}

            {!orderDetailLoading && selectedOrder && (
              <>
                <div className="popup-top">
                  <h3>Chi tiết đơn hàng</h3>

                  <button
                    type="button"
                    className="popup-close"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Đóng
                  </button>
                </div>

                <div className="order-header-grid">
                  <div className="order-card">
                    <h4>Thông tin đặt hàng</h4>

                    <div className="order-card-grid">
                      <div className="order-card-item">
                        <span className="label">Mã đơn</span>
                        <span className="value">#{selectedOrder.id}</span>
                      </div>

                      <div className="order-card-item">
                        <span className="label">Ngày đặt</span>
                        <span className="value">
                          {selectedOrder.createdAt
                            ? new Date(selectedOrder.createdAt).toLocaleDateString(
                                "vi-VN",
                              )
                            : "-"}
                        </span>
                      </div>

                      <div className="order-card-item">
                        <span className="label">Thời gian</span>
                        <span className="value">
                          {selectedOrder.createdAt
                            ? new Date(selectedOrder.createdAt).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "-"}
                        </span>
                      </div>

                      <div className="order-card-item">
                        <span className="label">Người nhận</span>
                        <span className="value">
                          {selectedOrder.shippingInfo?.name || "Người nhận"}
                        </span>
                      </div>

                      <div className="order-card-item">
                        <span className="label">Số điện thoại</span>
                        <span className="value">
                          {selectedOrder.shippingInfo?.phone || "-"}
                        </span>
                      </div>

                      <div className="order-card-item full">
                        <span className="label">Địa chỉ</span>
                        <span className="value">
                          {selectedOrder.shippingInfo?.address || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="order-card">
                    <h4>Tổng quan đơn hàng</h4>

                    <div className="order-card-flex">
                      <div className="order-card-item">
                        <span className="label">Trạng thái</span>
                        <span className="value status">{selectedOrder.status}</span>
                      </div>

                      <div className="order-card-item">
                        <span className="label">Thanh toán</span>
                        <span className="value">
                          {formatPaymentMethod(
                            selectedOrder.paymentMethod || selectedOrder.PaymentMethod,
                          )}
                        </span>
                      </div>

                      <div className="order-card-item">
                        <span className="label">Voucher</span>
                        <span className="value">
                          {selectedOrder.voucher || selectedOrder.Voucher || "Không áp dụng"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="items">
                  <h4>Sản phẩm</h4>

                  <ul>
                    {(selectedOrder.items || []).map((it, idx) => {
                      const imageSrc = resolveProductImageSrc(it.image || it.Image);

                      const productName =
                        it.productName || it.ProductName || it.name || "Sản phẩm";

                      const productId = it.productId || it.ProductID || "-";
                      const quantity = it.quantity || it.Quantity || 0;

                      const originalPrice = Number(
                        it.originalPrice || it.OriginalPrice || it.price || 0,
                      );
                      const salePrice = Number(it.salePrice || it.SalePrice || 0);
                      const lineTotal = Number(
                        it.lineTotal ||
                          it.LineTotal ||
                          (salePrice || originalPrice) * quantity ||
                          0,
                      );

                      return (
                        <li key={`${productId}-${idx}`} className="order-item-row">
                          <div className="order-item-main">
                            <div className="order-item-image-wrap">
                              {imageSrc ? (
                                <img
                                  src={imageSrc}
                                  alt={productName}
                                  className="order-item-image"
                                />
                              ) : (
                                <div className="order-item-image-fallback">
                                  No image
                                </div>
                              )}
                            </div>

                            <div className="order-item-meta">
                              <strong className="order-item-name">{productName}</strong>
                              <span className="order-item-id">Mã SP: {productId}</span>
                              <span className="order-item-qty">Số lượng: {quantity}</span>
                              <div className="order-item-prices">
                                {salePrice > 0 ? (
                                  <>
                                    <span className="price-sale">
                                      {salePrice.toLocaleString()} đ
                                    </span>
                                    <span className="price-original">
                                      {originalPrice.toLocaleString()} đ
                                    </span>
                                  </>
                                ) : (
                                  <span className="price-normal">
                                    {originalPrice.toLocaleString()} đ
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="order-item-total">
                            {lineTotal.toLocaleString()} đ
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="order-summary-footer">
                    <div className="summary-line">
                      <span>Tổng số lượng</span>
                      <strong>
                        {(selectedOrder.items || []).reduce(
                          (sum, item) => sum + Number(item.quantity || item.Quantity || 0),
                          0,
                        )}{" "}
                        sản phẩm
                      </strong>
                    </div>

                    <div className="summary-line">
                      <span>Giảm giá</span>
                      <strong className="discount">
                        -
                        {(() => {
                          // Tính tổng giảm giá từ sản phẩm (giá gốc - giá bán) nhân số lượng
                          const productDiscount = (selectedOrder.items || []).reduce(
                            (sum, item) => {
                              const quantity = Number(item.quantity || item.Quantity || 0);
                              const originalPrice = Number(
                                item.originalPrice || item.OriginalPrice || item.price || 0,
                              );
                              const salePrice = Number(
                                item.salePrice || item.SalePrice || originalPrice,
                              );
                              const discountPerItem = Math.max(originalPrice - salePrice, 0);
                              return sum + discountPerItem * quantity;
                            },
                            0,
                          );

                          // Lấy số tiền giảm từ voucher nếu có (trường `discount` hoặc các tên tương đương)
                          const voucherDiscount =
                            Number(
                              selectedOrder?.discount ||
                                selectedOrder?.Discount ||
                                selectedOrder?.discountAmount ||
                                selectedOrder?.voucherAmount ||
                                0,
                            ) || 0;

                          // Tổng giảm = giảm sản phẩm + giảm từ voucher
                          const totalDiscount = productDiscount + voucherDiscount;
                          return totalDiscount.toLocaleString();
                        })()}{" "}
                        đ
                      </strong>
                    </div>

                    <div className="summary-line total">
                      <span>Tổng tiền</span>
                      <strong>
                        {Number(selectedOrder.total || selectedOrder.Total || 0).toLocaleString()}{" "}
                        đ
                      </strong>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default OrdersSection;
