const { buildSepayCheckout } = require('./sepay.service');
const { generateOrderId, updateBillStatus } = require('../user/models/order.model');

/**
 * Tạo form thanh toán Sepay
 * POST /api/payment/create-checkout
 */
const handleCreatePayment = async (req, res) => {
  try {
    const { orderId, total, userId, paymentMethod, voucher, discount, subtotal } = req.body;

    // Nếu client không gửi `orderId`, tạo một invoice tạm thời (không lưu vào DB).
    // Điều này cho phép test nhanh flow thanh toán mà không cần tạo order trước.
    if (!total) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu total (tổng tiền thanh toán)',
      });
    }

    const effectiveOrderId = orderId || await generateOrderId();

    // Tạo dữ liệu checkout
    const payment = buildSepayCheckout({
      orderId: effectiveOrderId,
      total,
      userId,
      paymentMethod,
      voucher,
      discount,
      subtotal,
    });

    return res.json({
      success: true,
      payment,
    });
  } catch (err) {
    console.error('Create payment error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Lỗi khi tạo form thanh toán',
    });
  }
};

/**
 * Webhook từ Sepay khi khách hàng thanh toán thành công
 * POST /api/payment/webhook
 * 
 * Cập nhật trạng thái đơn hàng từ "Chờ thanh toán" → "Đã thanh toán"
 */
const handleWebhook = async (req, res) => {
  try {
    console.log('📥 Nhận webhook từ SePay:', JSON.stringify(req.body, null, 2));

    const payload = req.body || {};
    
    // Các trường có thể từ SePay webhook
    const orderId = payload.order_invoice_number || payload.orderId || payload.order_id;
    const transactionId = payload.transaction_code || payload.txn_id;
    const status = payload.status || 'SUCCESS';
    const amount = payload.amount || payload.order_amount || 0;

    if (!orderId) {
      console.warn('⚠️ Webhook không có orderId');
      return res.status(200).json({ success: true }); // Trả success cho Sepay để không gọi lại
    }

    // ✅ Sử dụng function từ order.model để update status
    try {
      if (status === 'SUCCESS' || status === 'COMPLETED') {
        const updateResult = await updateBillStatus(orderId, 'Đã thanh toán');
        
        if (updateResult.success) {
          console.log(`✅ Cập nhật đơn hàng ${orderId} → Đã thanh toán`);
        } else {
          console.warn(`⚠️ ${updateResult.message}`);
        }
      }
    } catch (updateErr) {
      console.error('❌ Lỗi update status:', updateErr);
      // Vẫn trả success để không gây lặp vô hạn
    }

    // Luôn trả success để SePay không gọi lại webhook
    return res.status(200).json({
      success: true,
      message: 'Webhook đã xử lý',
      orderId,
      transactionId,
    });
  } catch (err) {
    console.error('❌ Webhook error:', err);
    // Vẫn trả success để không gây lặp vô hạn
    return res.status(200).json({
      success: true,
      error: err.message,
    });
  }
};

exports.handleCreatePayment = handleCreatePayment;
exports.handleWebhook = handleWebhook;

/**
 * POST /api/payment/mark-paid
 * Used by frontend clients (after receiving PAYMENT_SUCCESS message) to
 * mark an order as paid when webhook may be delayed or unavailable in dev.
 */
const handleMarkPaid = async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Thiếu orderId' });
    }

    const updateResult = await updateBillStatus(orderId, 'Đã thanh toán');
    return res.json({ success: updateResult.success, message: updateResult.message });
  } catch (err) {
    console.error('❌ handleMarkPaid error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

exports.handleMarkPaid = handleMarkPaid;
