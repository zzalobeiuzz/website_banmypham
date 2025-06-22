function calculateDiscountPercent(price, salePrice) {
  if (!price || !salePrice) return 0;

  return Math.round(((price - salePrice) / price) * 100);
}

function calculateTimeLeft(endDateStr) {
  const endDate = new Date(endDateStr);
  const now = new Date();
  const diffMs = endDate - now;

  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `Còn ${days} ngày ${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
}

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
