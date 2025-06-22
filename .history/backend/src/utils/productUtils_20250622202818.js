//Hàm tính giảm giá phần trăm
function calculateDiscountPercent(product) {
  console.
  // if (!product?.Price || !product?.sale_price) return 0;
  return Math.round(((product.Price - product.sale_price) / product.Price) * 100);
}

//Hàm tính thời gian còn khuyến mãi
function calculateTimeLeft(product) {
  if (!product?.end_date) return '';
  const endDate = new Date(product.end_date);
  const now = new Date();
  const diffMs = endDate - now;
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `Còn ${days} ngày ${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
}

// ✅ Tổng hợp nếu cần cả 2
function formatDiscountProductAndDiscountDay(product) {
  return {
    ...product,
    discountPercent: calculateDiscountPercent(product),
    discountTimeLeft: calculateTimeLeft(product),
  };
}

// Xuất các hàm để sử dụng ở nơi khác
// ==============================================
module.exports = {
  calculateDiscountPercent,
  calculateTimeLeft,
  formatDiscountProductAndDiscountDay,
};
