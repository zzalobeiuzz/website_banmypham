/**
 * 🛒 CART PAGE
 * -----------------------------------------
 * Trang giỏ hàng
 */
import "@fortawesome/fontawesome-free/css/all.min.css";
import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import lottie from "lottie-web";
import "./cart.scss";
import useHttp from "../../../hooks/useHttp";
import TitleBanner from "../homePage/components/TitleBanner";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import noProductAnimation from "../../../animation/no_product.json";
import CheckoutSummary from "../component/checkout/step1_CheckoutSummary";
import CheckoutConfirm from "../component/checkout/step2_CheckoutConfirm";
import PaymentMethod from "../component/checkout/step3_PaymentMethod";
import OrderSuccess from "../component/checkout/step4_OrderSuccess";

const NoProductLottie = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let anim = null;

    if (containerRef.current) {
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        animationData: noProductAnimation,
      });
    }

    return () => {
      if (anim) anim.destroy();
    };
  }, []);

  return (
    <div
      className="no-product-lottie"
    >
      <div
        ref={containerRef}
        className="no-product-container"
      />
      <div
        className="no-product-message"
      >
        Giỏ hàng đang trống
      </div>
    </div>
  );
};

const Cart = () => {
  // 🧠 Lấy data từ context (GLOBAL)
  const { cartItems, increaseQty, decreaseQty, removeItem, clearCart } =
    useCart();
  const { user } = useAuth();

  const { request } = useHttp();
  const location = useLocation();
  const sepayFormRef = useRef(null);
  const sepayWindowRef = useRef(null);

  // 📦 State chứa dữ liệu FULL sản phẩm (đã merge từ API)
  const [products, setProducts] = useState([]);

  const [orderInfo, setOrderInfo] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState("");
  const isPaymentPendingRef = useRef(false);

  //State các bước thanh toán
  const [step, setStep] = useState(1);
  const [expandDetailsCart, setExpandDetailsCart] = useState(false);

  // 📋 State TOÀN BỘ THÔNG TIN ĐƠN HÀNG (tất cả dữ liệu cần tạo đơn)
  const [order, setOrder] = useState({
    // 👤 Người dùng
    userId: user?.id,
    // 📦 Thông tin giao hàng
    shippingInfo: {
      name: user?.profileName || user?.name || "",
      phone: user?.phoneNumber || user?.phone || "",
      address: user?.address || "",
    },
    // 🛒 Danh sách sản phẩm
    items: [],
    // 🎟 Voucher & Giảm giá
    voucher: "",
    discount: 0,
    subtotal: 0,
    total: 0,
    // 💳 Thanh toán
    paymentMethod: "COD", // COD hoặc Chuyển khoản
  });

  const clearPendingPaymentState = (restoreStep = false) => {
    try {
      localStorage.removeItem("pending_order");
      localStorage.removeItem("order_data");
    } catch (e) {}

    if (sepayWindowRef.current && !sepayWindowRef.current.closed) {
      try {
        sepayWindowRef.current.close();
      } catch (e) {}
    }

    sepayWindowRef.current = null;
    setPendingOrderId("");
    setIsPaymentPending(false);

    if (restoreStep) {
      setStep(3);
    }
  };

  useEffect(() => {
    isPaymentPendingRef.current = isPaymentPending;
  }, [isPaymentPending]);

  // =======================================
  // 💳 HANDLE PAYMENT CALLBACK REDIRECT
  // =======================================
  useEffect(() => {
    // Parse query params từ payment callback
    const queryParams = new URLSearchParams(location.search);
    const callbackStep = queryParams.get("step");
    const orderId = queryParams.get("order_id");
    const paymentStatus = queryParams.get("payment");

    // Nếu từ payment callback, jump to step 4
    if (callbackStep === "4" && orderId) {
      clearCart();
      setStep(4);
      clearPendingPaymentState(false);
      setExpandDetailsCart(true);

      (async () => {
        try {
          const res = await request("GET", `${API_BASE}/api/user/orders/detail/${orderId}`);
          const fetchedOrder = res?.order || res?.data?.order || res?.data || null;

          setOrderInfo({
            ...fetchedOrder,
            id: orderId,
            paymentStatus: paymentStatus || "success",
          });
        } catch (err) {
          console.warn("⚠️ Không lấy được chi tiết đơn hàng từ DB:", err);
          let orderDataFromStorage = null;
          try {
            const stored = localStorage.getItem("order_data");
            if (stored) {
              orderDataFromStorage = JSON.parse(stored);
            }
          } catch (e) {}

          setOrderInfo({
            id: orderId,
            paymentStatus: paymentStatus || "success",
            items: orderDataFromStorage?.items || [],
            total: orderDataFromStorage?.total || 0,
            subtotal: orderDataFromStorage?.subtotal || 0,
            discount: orderDataFromStorage?.discount || 0,
            shippingInfo: orderDataFromStorage?.shippingInfo || {},
          });
        }
      })();
    }
  }, [location.search, clearCart, request]);

  // =======================================
  // 📨 Nhận Message từ cổng Thanh Toán
  // =======================================
  useEffect(() => {
    const handlePaymentMessage = async (event) => {
      const { type, orderId, paymentStatus } = event.data || {};

      // Nếu nhận được message từ callback tab
      if (type === "PAYMENT_SUCCESS") {
        console.log("💌 CartDetail nhận được postMessage:", {
          orderId,
          paymentStatus,
        });

        // Cố gắng mark paid trên backend (nếu webhook chưa tới)
        try {
          const res = await request("POST", `${API_BASE}/api/user/orders/mark-paid`, { orderId });
          const backendOrder = res?.order || res?.data?.order || null;

          if (backendOrder) {
            setOrderInfo({
              ...backendOrder,
              id: orderId,
              paymentStatus: paymentStatus || "success",
            });
          }
        } catch (err) {
          console.warn("⚠️ Không thể gọi mark-paid endpoint:", err);
        }

        clearCart();
        clearPendingPaymentState(false);
        setStep(4);
        setExpandDetailsCart(true);
      }
    };

    // Thêm listener (không bao giờ remove để tránh miss message)
    window.addEventListener("message", handlePaymentMessage);
    // BroadcastChannel listener (same-origin reliable)
    let bc;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("sepay_channel");
        bc.onmessage = async (ev) => {
          const { type, orderId, paymentStatus } = ev.data || {};
          if (type === "PAYMENT_SUCCESS") {
            console.log("💡 CartDetail nhận BroadcastChannel:", {
              orderId,
              paymentStatus,
            });

            try {
              const res = await request("POST", `${API_BASE}/api/user/orders/mark-paid`, { orderId });
              const backendOrder = res?.order || res?.data?.order || null;

              if (backendOrder) {
                setOrderInfo({
                  ...backendOrder,
                  id: orderId,
                  paymentStatus: paymentStatus || "success",
                });
              }
            } catch (err) {
              console.warn("⚠️ Không thể gọi mark-paid endpoint (BC):", err);
            }

            clearCart();
            clearPendingPaymentState(false);
            setStep(4);
            setExpandDetailsCart(true);
          }
        };
      }
    } catch (err) {
      console.warn("⚠️ BroadcastChannel not available", err);
    }

    // localStorage fallback (storage event)
    const handleStorage = async (ev) => {
      if (!ev.key) return;
      if (ev.key === "sepay_last" && ev.newValue) {
        try {
          const payload = JSON.parse(ev.newValue);
          if (payload && payload.type === "PAYMENT_SUCCESS") {
            console.log("🗄️ CartDetail nhận localStorage event:", payload);
            try {
              await request("POST", `${API_BASE}/api/user/orders/mark-paid`, { orderId: payload.orderId });
            } catch (err) {
              console.warn("⚠️ Không thể gọi mark-paid endpoint (storage):", err);
            }

            clearCart();
            clearPendingPaymentState(false);
            setStep(4);
            setExpandDetailsCart(true);
          }
        } catch (err) {
          console.warn("⚠️ parse sepay_last", err);
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    // Theo dõi popup cổng thanh toán: nếu user đóng ngang thì mở khóa lại trang
    const pollPaymentWindow = setInterval(() => {
      if (!isPaymentPendingRef.current) return;

      const popupClosed = !sepayWindowRef.current || sepayWindowRef.current.closed;
      if (popupClosed) {
        clearPendingPaymentState(true);
      }
    }, 500);

    // Optional: cleanup khi component unmount (nhưng listener sẽ không hoạt động nếu component unmount)
    return () => {
      window.removeEventListener("message", handlePaymentMessage);
      try {
        if (bc) bc.close();
      } catch (e) {}
      window.removeEventListener("storage", handleStorage);
      clearInterval(pollPaymentWindow);
    };
  }, [clearCart, request]);

  // =========================
  // 📥 LOAD PRODUCT DETAIL
  // =========================
  useEffect(() => {
    const fetchCart = async () => {
      if (!cartItems.length) {
        setProducts([]);
        return;
      }

      const productIds = cartItems.map((item) => item.productId);

      try {
        const res = await request(
          "POST",
          `${API_BASE}/api/user/products/cart`,
          { ids: productIds },
        );
        console.log("🔥 RESPONSE FULL:", res);
        console.log("🔥 DATA:", res?.data);
        const data = res?.data || [];

        // 🔗 merge quantity từ context vào product
        const merged = data.map((p) => {
          const cartItem = cartItems.find((c) => c.productId === p.ProductID);

          return {
            id: p.ProductID,
            name: p.ProductName,
            price: Number(p.Price) || 0,

            // ✅ CHUẨN HÓA Ở ĐÂY
            sale_price: Number(p.sale_price) || 0, // giảm giá
            image: `${UPLOAD_BASE}/pictures/${p.Image}`,
            quantity: cartItem?.quantity || 1,
          };
        });

        setProducts(merged);
      } catch (err) {
        console.error("❌ Lỗi load cart:", err);
      }
    };

    fetchCart();
  }, [cartItems, request]);

  // =========================
  // 🧮 TÍNH TIỀN & CẬP NHẬT ORDER
  // =========================
  useEffect(() => {
    const subtotal = products.reduce((sum, item) => {
      const price = item.sale_price || item.price;
      return sum + price * item.quantity;
    }, 0);

    const total = subtotal - order.discount;

    // 📋 Cập nhật order state với thông tin tính toán
    setOrder((prev) => ({
      ...prev,
      userId: user?.id,
      items: products.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.sale_price || item.price,
      })),
      subtotal: subtotal,
      total: total,
    }));
  }, [products, order.discount, user?.id]);

  const getItemTotal = (item) => {
    const price = item.sale_price || item.price;
    return price * item.quantity;
  };

  // =========================
  // 🎟 THANH TOÁN
  // =========================
  const handleCheckout = () => {
    if (!user) {
      // ❌ chưa login → Thông báo mở popup login lên với hệ thống
      window.dispatchEvent(new Event("open-login"));
      // nhớ step lại để sau login quay lại
      return;
    }

    // ✅ đã login → điền sẵn thông tin từ user profile
    setOrder((prev) => ({
      ...prev,
      userId: user?.id,
      shippingInfo: {
        name: prev.shippingInfo.name || user?.profileName || user?.name || "",
        phone:
          prev.shippingInfo.phone || user?.phoneNumber || user?.phone || "",
        address: prev.shippingInfo.address || user?.address || "",
      },
    }));

    // Cho qua trang thanh toán
    setStep(2);
  };

  // =========================
  // ✅ XÁC NHẬN THANH TOÁN ĐƠN HÀNG (TẠO ORDER + TẠO PAYMENT)
  // =========================
  const handleFinalCheckout = async () => {
    setIsSubmittingOrder(true);
    try {
      const res = await request(
        "POST",
        `${API_BASE}/api/user/orders/add-orders`,
        {
          userId: order.userId,
          items: order.items,
          shippingInfo: order.shippingInfo,
          voucher: order.voucher,
          discount: order.discount,
          subtotal: order.subtotal,
          total: order.total,
          paymentMethod: order.paymentMethod,
        },
      );

      console.log("🧾 createOrder response:", res);


      // -------------- 💳 NẾU TRẢ VỀ YÊU CẦU THANH TOÁN CHUYỂN KHOẢN --------------
      if (res?.paymentRequired) {

        // 🔄 Chuyển trạng thái đang chờ thanh toán 
        setIsPaymentPending(true);
        setPendingOrderId("");

        // ❗ Kiểm tra payload SePay có đầy đủ không
        if (!res?.payment || !res.payment.checkoutUrl || !res.payment.fields) {
          // ❌ Nếu thiếu → dừng flow
          setIsPaymentPending(false);

          console.error(
            "❌ paymentRequired nhưng thiếu checkout payload:",
            res,
          );

          alert(
            "Có lỗi khi khởi tạo cổng thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
          );
        } else {


          // ✅ --------- FORM VÀ SUBMIT SANG SEPAY ---------
          const form = sepayFormRef.current;

          if (form) {
            // 🪟 Mở tab mới để hiển thị trang thanh toán
            // 👉 Dùng window name để có thể reuse (không mở nhiều tab)
            try {
              if (!sepayWindowRef.current || sepayWindowRef.current.closed) {
                sepayWindowRef.current = window.open("", "sepay_window");
              }
            } catch (err) {
              // ❌ Nếu bị chặn popup → fallback mở tab mới
              sepayWindowRef.current = null;
            }

            // 🌐 Gán URL thanh toán SePay vào form
            form.action = res.payment.checkoutUrl;

            // 🎯 Nếu có popup → submit vào popup
            // ❗ Nếu không → mở tab mới (_blank)
            form.target = sepayWindowRef.current ? "sepay_window" : "_blank";

            // 🧹 Xoá toàn bộ input cũ (tránh trùng dữ liệu giữa các lần thanh toán)
            form
              .querySelectorAll('input[type="hidden"]')
              .forEach((el) => el.remove());

            // 📦 Thêm lại các field do backend trả về (đã có signature bảo mật)
            Object.entries(res.payment.fields).forEach(([name, value]) => {
              const input = document.createElement("input");

              input.type = "hidden"; // 👻 input ẩn
              input.name = name; // 🔑 tên field (merchant_id, signature,...)
              input.value = value; // 📄 giá trị

              form.appendChild(input);
            });

            // Lưu orderId tạm để resume thanh toán nếu người dùng đóng tab
            try {
              const createdOrderId = res && res.data && res.data.id;
              if (createdOrderId) {
                setPendingOrderId(createdOrderId);
                localStorage.setItem(
                  "pending_order",
                  JSON.stringify({ orderId: createdOrderId, total: order.total, createdAt: Date.now() })
                );
                // 💾 Lưu full order data để hiển thị step 4 khi nhận PAYMENT_SUCCESS callback
                localStorage.setItem(
                  "order_data",
                  JSON.stringify({
                    items: order.items,
                    total: order.total,
                    subtotal: order.subtotal,
                    discount: order.discount,
                    shippingInfo: order.shippingInfo,
                  })
                );
              }
            } catch (e) {
              console.warn("⚠️ Không thể lưu pending_order", e);
            }

            // 🚀 Submit form → chuyển sang cổng thanh toán SePay
            form.submit();

            // 🎯 Focus vào popup nếu mở được
            try {
              if (sepayWindowRef.current && !sepayWindowRef.current.closed) {
                sepayWindowRef.current.focus();
              }
            } catch (e) {}
          }
        }

        // ⛔ Dừng flow tại đây (không chạy các bước tiếp theo như navigate)
        return;
      }

      if (res?.data) {
        clearPendingPaymentState(false);
        setOrderInfo(res.data);
        setStep(4);
      }
    } catch (err) {
      clearPendingPaymentState(false);
      console.error("❌ Lỗi hoàn tất đơn hàng:", err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // =========================
  // 🎟 VOUCHER
  // =========================
  const applyVoucher = () => {
    if (order.voucher === "SALE50") {
      setOrder((prev) => ({
        ...prev,
        discount: 50000,
      }));
    } else {
      setOrder((prev) => ({
        ...prev,
        discount: 0,
      }));
      alert("Voucher không hợp lệ");
    }
  };

  return (
    <>
      <TitleBanner option={"Giỏ hàng"} />

      <div className="cart-detail-page">
        {isPaymentPending && (
        <div className="payment-lock-overlay">
          <div className="payment-lock-modal">
            <div className="payment-icon">⏳</div>
            <h3>Đang xử lý thanh toán</h3>
            <p>
              Vui lòng không thao tác trên trang này cho đến khi thanh toán hoàn tất.
              Nếu bạn đóng tab cổng thanh toán, hệ thống sẽ tự mở khóa lại để bạn tiếp tục.
            </p>
            <div className="payment-order-id">
              Mã đơn: {pendingOrderId || "-"}
            </div>
            <button
              type="button"
              onClick={() => clearPendingPaymentState(true)}
              className="btn-cancel-payment"
            >
              Hủy thanh toán
            </button>
          </div>
        </div>
        )}

        <div className={`cart-detail-main ${step === 4 && expandDetailsCart ? 'expand-details-view' : ''}`}>
          {/* ================= LEFT ================= */}
          <div className="main-left">
            <div className="cart-header-wrapper">
              <h2>Giỏ hàng</h2>
            </div>
            {products.length === 0 ? (
              <NoProductLottie />
            ) : (
              <>
                <div className="cart-header">
                  <div className="cart-col image">Ảnh</div>
                  <div className="cart-col name">Sản phẩm</div>
                  <div className="cart-col price">Giá</div>
                  <div className="cart-col qty">Số lượng</div>
                  <div className="cart-col total">Thành tiền</div>
                </div>
                {products.map((item) => (
                  <div className="cart-item" key={item.id}>
                    {/* 🖼 ẢNH */}
                    <div className="cart-col image">
                      <img src={item.image} alt={item.name} />
                    </div>

                    {/* 📦 TÊN */}
                    <div className="cart-col name">
                      <h4>{item.name}</h4>
                    </div>

                    {/* 💰 GIÁ */}
                    <div className="cart-col price">
                      {Number(item.sale_price) > 0 ? (
                        <div className="price-box">
                          <span className="price-sale">
                            {Number(item.sale_price).toLocaleString("vi-VN")}đ
                          </span>
                          <span className="price-original">
                            {Number(item.price).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      ) : (
                        <span className="price-normal">
                          {Number(item.price).toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </div>

                    {/* 🔢 SỐ LƯỢNG */}
                    <div className="cart-col qty">
                      <button onClick={() => decreaseQty(item.id)}>➖</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => increaseQty(item.id)}>➕</button>
                    </div>

                    {/* 🧮 THÀNH TIỀN */}
                    <div className="cart-col total">
                      <strong className="total-price">
                        {getItemTotal(item).toLocaleString("vi-VN")}đ
                      </strong>
                    </div>

                    {/* ❌ XOÁ */}
                    <div className="cart-col remove">
                      <button onClick={() => removeItem(item.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* ================= RIGHT ================= */}
          {(products.length > 0 || step === 4) && (
            <div className="main-right">
              {step === 1 && (
                <CheckoutSummary
                  order={order}
                  setOrder={setOrder}
                  applyVoucher={applyVoucher}
                  handleCheckout={handleCheckout}
                />
              )}
              {step === 2 && (
                <CheckoutConfirm
                  setStep={setStep}
                  order={order}
                  setOrder={setOrder}
                />
              )}
              {step === 3 && (
                <>
                  {isPaymentPending && (
                    <div className="payment-pending-banner">
                      <small>
                        Đang chờ thanh toán cho đơn <strong>{(() => {
                          try {
                            const p = JSON.parse(localStorage.getItem("pending_order") || "{}");
                            return p.orderId || "-";
                          } catch (e) {
                            return "-";
                          }
                        })()}</strong>
                      </small>
                      <button
                        className="btn-cancel-pending"
                        onClick={() => {
                          localStorage.removeItem("pending_order");
                          setIsPaymentPending(false);
                        }}
                      >
                        Hủy thanh toán
                      </button>
                    </div>
                  )}

                  <PaymentMethod
                    order={order}
                    setOrder={setOrder}
                    setStep={setStep}
                    handleFinalCheckout={handleFinalCheckout}
                    isSubmittingOrder={isSubmittingOrder}
                  />
                </>
              )}
              {step === 4 && (
                <OrderSuccess
                  orderInfo={orderInfo}
                  setStep={setStep}
                  isExpanded={expandDetailsCart}
                  onToggleExpand={() => setExpandDetailsCart((prev) => !prev)}
                />
              )}
            </div>
          )}
        </div>

        {/* 🚚 FOOTER */}
        <div className="cart-detail-option">
          <p>🚚 Miễn phí vận chuyển cho đơn từ 500k</p>
        </div>
      </div>

      {/* 🔒 HIDDEN SEPAY FORM - AUTO-SUBMIT */}
      <form
        ref={sepayFormRef}
        method="POST"
        target="_blank"
        className="hidden-sepay-form"
      >
        {/* Hidden inputs sẽ được populate động trong handleFinalCheckout */}
      </form>
    </>
  );
};

export default Cart;
