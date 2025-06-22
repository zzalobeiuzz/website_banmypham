function calculateDiscountPercent(p) {
  if (!p?.Price || !p?.sale_price) return { ...p, discountPercent: 0 };

  const discountPercent = Math.round(((p.Price - p.sale_price) / p.Price) * 100);

  return { ...p, discountPercent };
}

function calculateTimeLeft(p) {
  const endDate = new Date(p.end_date);
  const now = new Date();
  const diffMs = endDate - now;

  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const discountTimeLeft = `Còn ${days} ngày ${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;

  return { ...p, discountTimeLeft };
}


// Hàm kết hợp thực thi 2 hàm tính phần trăm giảm giá và thời gian hết hạn giảm giá
function formatDiscountProductAndDiscountDay(p) {
  return {
    ...p,
    discountPercent: calculateDiscountPercent(p.Price, p.sale_price),
    discountTimeLeft: calculateTimeLeft(p.end_date),
  };
}

module.exports = {
  formatDiscountProductAndDiscountDay,
  calculateDiscountPercent,
  calculateTimeLeft,
};
