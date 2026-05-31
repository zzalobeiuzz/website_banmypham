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
    <div className="no-product-lottie">
      <div ref={containerRef} className="no-product-container" />
      <div className="no-product-message">Giỏ hàng đang trống</div>
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
  const handledPaymentOrdersRef = useRef(new Set());

  //State các bước thanh toán
  const [step, setStep] = useState(1);
  const [expandDetailsCart, setExpandDetailsCart] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

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

  /*========================================================
   💳 XỬ LÝ KHI NHẬN THÔNG BÁO THANH TOÁN THÀNH CÔNG TỪ SEPAY
    ========================================================*/
  useEffect(() => {
    const finalizePaymentSuccess = async ({
      orderId,
      paymentStatus = "success",
      source = "unknown",
    }) => {
      const safeOrderId = String(orderId || "").trim();
      if (!safeOrderId) return;

      if (handledPaymentOrdersRef.current.has(safeOrderId)) {
        return;
      }
      handledPaymentOrdersRef.current.add(safeOrderId);

      let nextOrderInfo = null;

      try {
        // 1) Cập nhật trạng thái thanh toán thành công (backend sẽ trừ kho tại đây)
        const paidRes = await request(
          "POST",
          `${API_BASE}/api/user/orders/mark-paid`,
          {
            orderId: safeOrderId,
          },
        );
        console.log(`✅ mark-paid response from ${source}:`, paidRes);

        const backendOrder = paidRes?.order || paidRes?.data?.order || null;

        if (backendOrder) {
          nextOrderInfo = {
            ...backendOrder,
            id: safeOrderId,
            paymentStatus: paymentStatus || "success",
          };
        }
      } catch (err) {
        console.warn(`⚠️ mark-paid thất bại từ ${source}:`, err);
      }

      // 2) Fallback sang localStorage nếu backend chưa trả đủ dữ liệu
      if (!nextOrderInfo) {
        let orderDataFromStorage = null;
        try {
          const stored = localStorage.getItem("order_data");
          if (stored) {
            orderDataFromStorage = JSON.parse(stored);
          }
        } catch (e) {}

        nextOrderInfo = {
          id: safeOrderId,
          paymentStatus: paymentStatus || "success",
          items: orderDataFromStorage?.items || [],
          total: orderDataFromStorage?.total || 0,
          subtotal: orderDataFromStorage?.subtotal || 0,
          discount: orderDataFromStorage?.discount || 0,
          shippingInfo: orderDataFromStorage?.shippingInfo || {},
        };
      }

      if (nextOrderInfo) {
        setOrderInfo(nextOrderInfo);
      }

      // 3) Chuyển sang step 4
      clearCart();
      clearPendingPaymentState(false);
      setStep(4);
      setExpandDetailsCart(true);
    };

    /**
     * 📩 Nhận message bằng postMessage()
     * ---------------------------------------
     * Callback tab sẽ gửi:
     * window.opener.postMessage(...)
     */
    // Uu ti�n x? l� callback URL tru?c
    const queryParams = new URLSearchParams(location.search);
    const callbackStep = queryParams.get("step");
    const callbackOrderId = queryParams.get("order_id");
    const callbackPaymentStatus = queryParams.get("payment");

    // MOMO callback format:
    // ?step=4&partnerCode=MOMO&...&resultCode=0&extraData=DH...&...
    const momoResultCode = queryParams.get("resultCode");
    const momoExtraData = queryParams.get("extraData");

    // N?u dang ? popup callback th� b�o cho tab g?c r?i t? d�ng popup
    const notifyParentAndClose = (orderId) => {
      try {
        if (window.opener && !window.opener.closed && orderId) {
          window.opener.postMessage(
            {
              type: "PAYMENT_SUCCESS",
              orderId,
              paymentStatus: "success",
            },
            window.location.origin,
          );
          window.close();
          return true;
        }
      } catch (e) {
        console.warn("Không thể gọi PAYMENT_SUCCESS cho tab g?c", e);
      }
      return false;
    };

    if (callbackStep === "4" && momoResultCode === "0" && momoExtraData) {
      if (!notifyParentAndClose(momoExtraData)) {
        finalizePaymentSuccess({
          orderId: momoExtraData,
          paymentStatus: "success",
          source: "momo-callback",
        });
      }
    } else if (callbackStep === "4" && callbackOrderId) {
      if (!notifyParentAndClose(callbackOrderId)) {
        finalizePaymentSuccess({
          orderId: callbackOrderId,
          paymentStatus: callbackPaymentStatus,
          source: "callback-query",
        });
      }
    }

    const handlePaymentMessage = async (event) => {
      const { type, orderId, paymentStatus } = event.data || {};

      // ✅ Nếu là tín hiệu thanh toán thành công
      if (type === "PAYMENT_SUCCESS") {
        console.log("💌 CartDetail nhận được postMessage:", {
          orderId,
          paymentStatus,
        });

        // 🔄 Đồng bộ trạng thái thanh toán
        await finalizePaymentSuccess({
          orderId,
          paymentStatus,
          source: "postMessage",
        });
      }
    };

    /**
     * 👂 Lắng nghe message từ tab/payment popup
     */
    window.addEventListener("message", handlePaymentMessage);

    /**
     * =======================================
     * 📡 BroadcastChannel
     * =======================================
     */

    let bc;

    try {
      // ✅ Browser hỗ trợ BroadcastChannel
      if (typeof BroadcastChannel !== "undefined") {
        // 📡 Tạo channel chung
        bc = new BroadcastChannel("sepay_channel");

        // 📩 Khi nhận message từ channel
        bc.onmessage = async (ev) => {
          const { type, orderId, paymentStatus } = ev.data || {};

          if (type === "PAYMENT_SUCCESS") {
            console.log("💡 CartDetail nhận BroadcastChannel:", {
              orderId,
              paymentStatus,
            });

            // 🔄 Đồng bộ trạng thái thanh toán
            await finalizePaymentSuccess({
              orderId,
              paymentStatus,
              source: "broadcast-channel",
            });
          }
        };
      }
    } catch (err) {
      console.warn("⚠️ BroadcastChannel not available", err);
    }

    /**
     * =======================================
     * 🗄️ localStorage fallback
     * =======================================
     * Nếu browser không hỗ trợ BroadcastChannel
     * thì dùng storage event thay thế
     */

    const handleStorage = async (ev) => {
      // ❌ Không có key
      if (!ev.key) return;

      // ✅ Nếu key thanh toán thay đổi
      if (ev.key === "sepay_last" && ev.newValue) {
        try {
          // 📦 Parse dữ liệu JSON
          const payload = JSON.parse(ev.newValue);

          // ✅ Nếu thanh toán thành công
          if (payload && payload.type === "PAYMENT_SUCCESS") {
            console.log("🗄️ CartDetail nhận localStorage event:", payload);

            // 🔄 Đồng bộ trạng thái thanh toán
            await finalizePaymentSuccess({
              orderId: payload.orderId,
              paymentStatus: payload.paymentStatus,
              source: "storage-event",
            });
          }
        } catch (err) {
          console.warn("⚠️ parse sepay_last", err);
        }
      }
    };

    /**
     * 👂 Lắng nghe thay đổi localStorage
     */
    window.addEventListener("storage", handleStorage);

    /**
     * =======================================
     * 👀 Theo dõi popup thanh toán
     * =======================================
     * Nếu user đóng popup ngang
     * → reset trạng thái pending payment
     */

    const pollPaymentWindow = setInterval(() => {
      // ❌ Không ở trạng thái chờ thanh toán
      if (!isPaymentPendingRef.current) return;

      // 📌 Kiểm tra popup còn mở không
      const popupClosed =
        !sepayWindowRef.current || sepayWindowRef.current.closed;

      // ✅ Nếu popup bị đóng
      if (popupClosed) {
        // 🔓 Mở khóa trạng thái thanh toán
        clearPendingPaymentState(true);
      }
    }, 500);

    /**
     * =======================================
     * 🧹 Cleanup khi component unmount
     * =======================================
     */

    return () => {
      // ❌ Remove postMessage listener
      window.removeEventListener("message", handlePaymentMessage);

      // ❌ Đóng BroadcastChannel
      try {
        if (bc) bc.close();
      } catch (e) {}

      // ❌ Remove storage listener
      window.removeEventListener("storage", handleStorage);

      // ❌ Clear interval kiểm tra popup
      clearInterval(pollPaymentWindow);
    };
  }, [location.search, clearCart, request]);

  // ======================================================
  // 📥 HIỆN THÔNG TIN CHI TIẾT DANH SÁCH SP TRONG GIỎ HÀNG
  // ======================================================
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
            stockQuantity: Number(p.StockQuantity) || 0,

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
      // Dùng sale_price nếu có, không thì dùng price gốc
      const finalPrice = item.sale_price || item.price;
      return sum + finalPrice * item.quantity;
    }, 0);

    const total = subtotal - order.discount;

    // 📋 Cập nhật order state với thông tin tính toán
    setOrder((prev) => ({
      ...prev,
      userId: user?.id,
      items: products.map((item) => {
        const originalPrice = Number(item.price) || 0;
        const salePrice = Number(item.sale_price) || 0;
        return {
          productId: item.id,
          quantity: item.quantity,
          originalPrice: originalPrice,
          salePrice: salePrice,
          price: salePrice > 0 ? salePrice : originalPrice // giá cuối để tính toán
        };
      }),
      subtotal: subtotal,
      total: total,
    }));
  }, [products, order.discount, user?.id]);

  const getItemTotal = (item) => {
    const price = item.sale_price || item.price;
    return price * item.quantity;
  };

  const buildOrderDisplayItems = () => {
    return products.map((item) => {
      const originalPrice = Number(item.price) || 0;
      const salePrice = Number(item.sale_price) || 0;
      const finalPrice = salePrice > 0 ? salePrice : originalPrice;

      return {
        productId: item.id,
        name: item.name,
        image: item.image,
        quantity: Number(item.quantity) || 1,
        originalPrice: originalPrice,
        salePrice: salePrice,
        price: finalPrice,
      };
    });
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
  // ✅ XÁC NHẬN TẠO ĐƠN HÀNG (TẠO ORDER + TẠO PAYMENT)
  // =========================
  const handleFinalCheckout = async () => {
    console.log("🚀 handleFinalCheckout called with order data:", order);
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
      // --------------💳 COD ----------------
      // 🔍 DEBUG: Log full response structure
      console.log("📊 Response structure:", {
        success: res?.success,
        paymentMethod: res?.paymentMethod,
        paymentRequired: res?.paymentRequired,
        hasData: !!res?.data,
        hasPayment: !!res?.payment,
        paymentKeys: res?.payment ? Object.keys(res.payment) : [],
      });

      if (res?.paymentMethod === "COD") {
        alert("Đơn hàng đã được tạo thành công!");

        const createdOrderId = res?.data?.id || res?.data?.OrderID || "";
        const fullOrderInfo = {
          ...(res?.data || {}),
          id: createdOrderId || res?.data?.id,
          items: buildOrderDisplayItems(),
          total: order.total,
          subtotal: order.subtotal,
          discount: order.discount,
          shippingInfo: order.shippingInfo,
          paymentStatus: "success",
        };

        try {
          if (createdOrderId) {
            localStorage.setItem(
              "order_data",
              JSON.stringify({
                items: buildOrderDisplayItems(),
                total: order.total,
                subtotal: order.subtotal,
                discount: order.discount,
                shippingInfo: order.shippingInfo,
              }),
            );
          }
        } catch (e) {
          console.warn("⚠️ Không thể lưu order_data cho COD", e);
        }

        // ✅ reset cart
        clearCart();

        // ✅ reset payment state
        clearPendingPaymentState(false);

        // ✅ set dữ liệu đơn hàng
        setOrderInfo(fullOrderInfo);

        // ✅ sang step success
        setStep(4);

        // ✅ mở rộng chi tiết
        setExpandDetailsCart(true);

        return;
      }
      // -------------- 💳 NẾU TRẢ VỀ LÀ THANH TOÁN CHUYỂN KHOẢN --------------
      if (res?.paymentMethod === "TRANSFER" && res?.paymentRequired) {
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
                  JSON.stringify({
                    orderId: createdOrderId,
                    total: order.total,
                    createdAt: Date.now(),
                  }),
                );
                // 💾 Lưu full order data để hiển thị step 4 khi nhận PAYMENT_SUCCESS callback
                localStorage.setItem(
                  "order_data",
                  JSON.stringify({
                    items: buildOrderDisplayItems(),
                    total: order.total,
                    subtotal: order.subtotal,
                    discount: order.discount,
                    shippingInfo: order.shippingInfo,
                  }),
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
      // -------------- 💳 NẾU TRẢ VỀ LÀ THANH TOÁN MOMO --------------
      else if (res?.paymentMethod === "MOMO" && res?.paymentRequired) {
        // 🔄 Chuyển trạng thái đang chờ thanh toán
        setIsPaymentPending(true);
        setPendingOrderId("");

        // ❗ Kiểm tra payload MOMO có đầy đủ không
        if (!res?.payment || !res.payment.payUrl) {
          // ❌ Nếu thiếu → dừng flow
          setIsPaymentPending(false);

          console.error("❌ paymentRequired nhưng thiếu payUrl:", res);

          alert(
            "Có lỗi khi khởi tạo cổng thanh toán MOMO. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
          );
        } else {
          // ✅ ----- REDIRECT SANG MOMO PAYMENT PAGE -----
          const createdOrderId = res && res.data && res.data.id;

          if (createdOrderId) {
            setPendingOrderId(createdOrderId);

            // 💾 Lưu pending order info
            try {
              localStorage.setItem(
                "pending_order",
                JSON.stringify({
                  orderId: createdOrderId,
                  total: order.total,
                  createdAt: Date.now(),
                }),
              );

              // 💾 Lưu full order data để hiển thị step 4 khi nhận PAYMENT_SUCCESS callback
              localStorage.setItem(
                "order_data",
                JSON.stringify({
                  items: buildOrderDisplayItems(),
                  total: order.total,
                  subtotal: order.subtotal,
                  discount: order.discount,
                  shippingInfo: order.shippingInfo,
                }),
              );
            } catch (e) {
              console.warn("⚠️ Không thể lưu pending_order", e);
            }

            // 🌐 Redirect đến MOMO payment page
            console.log("🚀 MOMO payUrl:", res.payment.payUrl);

            // ✅ Cách 1: Thử mở popup (nếu được phép)
            try {
              const momoWindow = window.open(res.payment.payUrl, "momo_window");
              if (momoWindow) {
                sepayWindowRef.current = momoWindow;
                momoWindow.focus();
                console.log("✅ Mở popup MOMO thành công");
              } else {
                // ❌ Popup bị chặn → Cách 2: Dùng direct navigation
                console.warn("⚠️ Popup bị chặn, dùng direct navigation...");
                window.location.href = res.payment.payUrl;
              }
            } catch (err) {
              // ❌ Lỗi → Cách 3: Direct navigation
              console.error("❌ Lỗi mở popup:", err);
              window.location.href = res.payment.payUrl;
            }
          }
        }

        // ⛔ Dừng flow tại đây (không chạy các bước tiếp theo)
        return;
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
  const applyVoucher = async () => {
    const voucherCode = String(order.voucher || "").trim();

    if (!voucherCode) {
      setOrder((prev) => ({
        ...prev,
        discount: 0,
      }));
      alert("Vui lòng nhập mã giảm giá.");
      return;
    }

    try {
      const res = await request(
        "GET",
        `${API_BASE}/api/user/vouchers/validate?code=${encodeURIComponent(voucherCode)}&subtotal=${encodeURIComponent(order.subtotal || 0)}`,
      );

      const voucherData = res?.data || res;
      const discountAmount = Number(voucherData?.discountAmount || 0) || 0;

      setOrder((prev) => ({
        ...prev,
        voucher: String(voucherData?.code || voucherCode).toUpperCase(),
        discount: discountAmount,
      }));

      alert(`Áp dụng mã giảm giá thành công. Giảm ${discountAmount.toLocaleString("vi-VN")}đ.`);
    } catch (error) {
      setOrder((prev) => ({
        ...prev,
        discount: 0,
      }));
      alert(error?.message || "Voucher không hợp lệ");
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
                Vui lòng không thao tác trên trang này cho đến khi thanh toán
                hoàn tất. Nếu bạn đóng tab cổng thanh toán, hệ thống sẽ tự mở
                khóa lại để bạn tiếp tục.
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

        <div
          className={`cart-detail-main ${step === 4 && expandDetailsCart ? "expand-details-view" : ""}`}
        >
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
                      <button
                        disabled={
                          item.stockQuantity > 0 &&
                          item.quantity >= item.stockQuantity
                        }
                        onClick={() => {
                          const ok = increaseQty(item.id, item.stockQuantity);
                          if (!ok) {
                            window.alert(
                              `Chỉ còn ${item.stockQuantity} sản phẩm trong kho.`,
                            );
                          }
                        }}
                      >
                        ➕
                      </button>
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

                {products.length > 0 && (
                  <button
                    onClick={() => setShowClearModal(true)}
                    className="btn-clear-all"
                    title="Xóa tất cả sản phẩm"
                    aria-haspopup="dialog"
                    aria-expanded={showClearModal}
                  >
                    Xóa tất cả
                  </button>
                )}
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
                        Đang chờ thanh toán cho đơn{" "}
                        <strong>
                          {(() => {
                            try {
                              const p = JSON.parse(
                                localStorage.getItem("pending_order") || "{}",
                              );
                              return p.orderId || "-";
                            } catch (e) {
                              return "-";
                            }
                          })()}
                        </strong>
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

      {/* ===== CONFIRM CLEAR-ALL MODAL ===== */}
      {showClearModal && (
        <div className="confirm-modal-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal">
            <button
              className="confirm-modal-close"
              onClick={() => setShowClearModal(false)}
              aria-label="Đóng"
            >
              ✕
            </button>
            <h3>Xác nhận</h3>
            <p>Bạn chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?</p>
            <div className="confirm-actions">
              <button
                className="btn btn-cancel"
                onClick={() => setShowClearModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn btn-confirm"
                onClick={() => {
                  clearCart();
                  setShowClearModal(false);
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
