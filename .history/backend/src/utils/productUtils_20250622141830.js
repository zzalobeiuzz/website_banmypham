// utils/productUtils.js

// Hàm tính phần trăm giảm giá và thời gian còn lại
function formatDiscountProduct(p) {
    const endDate = new Date(p.end_date);
    const now = new Date();
    const diffMs = endDate - now;
  
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000)); // Không âm
  
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    return {
      ...p,
      discountPercent: Math.round(((p.Price - p.sale_price) / p.Price) * 100),
      discountTimeLeft: `Còn ${days} ngày ${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`,
    };
  }
  
  module.exports = { formatDiscountProduct };
  