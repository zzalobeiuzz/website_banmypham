// 👉 Hiệu ứng bay ảnh sản phẩm vào giỏ hàng (giống Shopee / Tiki)

 /* 👉 Clone ảnh sản phẩm và animate bay tới icon giỏ hàng
 *
 * @param {HTMLElement} sourceImage - DOM node của ảnh sản phẩm (img)
 * @param {string} cartSelector - CSS selector trỏ tới icon giỏ hàng
 */
export function flyToCart(
  sourceImage,
  cartSelector = ".shopping-cart-icon-wrap img, .shopping-cart-icon-wrap"
) {
  // ❌ Nếu không có ảnh nguồn thì không làm gì
  if (!sourceImage) return;

  // 🔍 Tìm icon giỏ hàng trên DOM
  const cartIcon = document.querySelector(cartSelector);

  // ❌ Nếu không tìm thấy cart thì bỏ luôn
  if (!cartIcon) return;

  // 📐 Lấy vị trí & kích thước của ảnh gốc
  const sourceRect = sourceImage.getBoundingClientRect();

  // 📐 Lấy vị trí & kích thước của icon giỏ hàng
  const targetRect = cartIcon.getBoundingClientRect();

  // ❌ Nếu ảnh không có size (chưa render xong) thì bỏ
  if (!sourceRect.width || !sourceRect.height) return;

  // 🧬 Clone ảnh (tạo bản copy để animate)
  const clone = sourceImage.cloneNode(true);

  // 🎯 Đặt clone ở vị trí fixed để bay tự do trên màn hình
  clone.style.position = "fixed";

  // 📍 Đặt clone đúng vị trí ảnh gốc ban đầu
  clone.style.left = `${sourceRect.left}px`;
  clone.style.top = `${sourceRect.top}px`;

  // 📏 Giữ nguyên kích thước ảnh ban đầu
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;

  // 🎨 Style thêm cho đẹp
  clone.style.objectFit = "contain";
  clone.style.borderRadius = "12px";
  clone.style.background = "#fff";
  clone.style.boxShadow = "0 16px 34px rgba(15, 23, 42, 0.18)";

  // 🔝 Luôn nổi trên cùng
  clone.style.zIndex = "9999";

  // 🛑 Không cho click vào clone
  clone.style.pointerEvents = "none";

  // 🎬 Thiết lập animation (transform + opacity)
  clone.style.transition =
    "transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 650ms ease";

  // 📌 Tâm transform ở giữa ảnh
  clone.style.transformOrigin = "center center";

  // ➕ Gắn clone vào body để hiển thị
  document.body.appendChild(clone);

  // 📍 Tính tâm của ảnh gốc
  const fromCenterX = sourceRect.left + sourceRect.width / 2;
  const fromCenterY = sourceRect.top + sourceRect.height / 2;

  // 📍 Tính tâm của icon giỏ hàng
  const toCenterX = targetRect.left + targetRect.width / 2;
  const toCenterY = targetRect.top + targetRect.height / 2;

  // 📏 Tính khoảng cách cần bay
  const deltaX = toCenterX - fromCenterX;
  const deltaY = toCenterY - fromCenterY;

  // 🎬 Trigger animation ở frame tiếp theo (tránh bug render)
  window.requestAnimationFrame(() => {
    // 👉 Bay từ vị trí hiện tại → cart + thu nhỏ lại
    clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.12)`;

    // 👉 Làm mờ dần
    clone.style.opacity = "0.25";
  });

  // 🧹 Hàm dọn dẹp (xóa clone khỏi DOM)
  const cleanup = () => {
    if (clone.parentNode) clone.parentNode.removeChild(clone);
  };

  // 🎯 Khi animation kết thúc → tự xóa
  clone.addEventListener("transitionend", cleanup, { once: true });

  // 🛟 Backup: nếu transition không chạy thì vẫn xóa sau 800ms
  setTimeout(cleanup, 800);
}
