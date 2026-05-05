import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PaymentCallback - Xử lý callback từ SePay
 * 
 * URL từ SePay:
 * - /payment/success?order_id=DH...
 * - /payment/error?order_id=DH...
 * - /payment/cancel?order_id=DH...
 * 
 * Flow:
 * 1. Lấy order_id + status từ URL
 * 2. Gửi postMessage về parent window (tab gốc)
 * 3. Đợi parent window nhận message
 * 4. Đóng tab callback
 * (KHÔNG redirect - để tránh tạo tab mới)
 */
const PaymentCallback = () => {
  const location = useLocation();

  useEffect(() => {
    // Lấy order_id từ query params
    const orderId = new URLSearchParams(location.search).get('order_id');
    
    // Xác định status từ pathname
    const pathname = location.pathname.toLowerCase();
    let paymentStatus = 'success';
    if (pathname.includes('error')) paymentStatus = 'error';
    else if (pathname.includes('cancel')) paymentStatus = 'cancel';

    console.log('🔔 Callback tab nhận được:', { orderId, paymentStatus });

    // Prepare payload
    const payload = {
      type: 'PAYMENT_SUCCESS',
      orderId,
      paymentStatus,
      timestamp: Date.now(),
    };

    // 1) Try BroadcastChannel (same-origin, reliable)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('sepay_channel');
        bc.postMessage(payload);
        bc.close();
        console.log('📡 Sent via BroadcastChannel');
      }
    } catch (err) {
      console.warn('⚠️ BroadcastChannel error', err);
    }

    // 2) postMessage to opener (if exists)
    try {
      if (window.opener) {
        window.opener.postMessage(payload, '*');
        console.log('📤 Sent via window.opener.postMessage');
      }
    } catch (err) {
      console.warn('⚠️ opener postMessage error', err);
    }

    // 3) localStorage fallback (storage event)
    try {
      localStorage.setItem('sepay_last', JSON.stringify(payload));
      // remove quickly to avoid buildup
      setTimeout(() => localStorage.removeItem('sepay_last'), 500);
      console.log('🗄️ Sent via localStorage');
    } catch (err) {
      console.warn('⚠️ localStorage fallback failed', err);
    }

    // Finally, close tab after short delay
    setTimeout(() => {
      try {
        window.close();
        console.log('❌ Attempted to close popup');
      } catch (err) {
        console.warn('⚠️ window.close failed', err);
      }
    }, 800);
  }, [location]);

  // Hiển thị loading trong khi xử lý
  return (
    <div style={{ textAlign: 'center', padding: '50px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h3>⏳ Đang xử lý kết quả thanh toán...</h3>
      <p>Tab này sẽ tự động đóng sau khi hoàn thành</p>
      <p style={{ fontSize: '12px', color: '#666' }}>Nếu tab không đóng, bạn có thể đóng thủ công</p>
    </div>
  );
};

export default PaymentCallback;
