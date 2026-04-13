// FlyToCart.js
// Hiệu ứng bay ảnh về giỏ hàng, dùng lại cho các trang user

/**
 * flyToCart: clone ảnh và animate về vị trí cart icon
 * @param {HTMLElement} sourceImage - DOM node của ảnh sản phẩm
 * @param {string} cartSelector - CSS selector tới icon giỏ hàng
 */
export function flyToCart(sourceImage, cartSelector = ".shopping-cart-icon-wrap img, .shopping-cart-icon-wrap") {
  if (!sourceImage) return;
  const cartIcon = document.querySelector(cartSelector);
  if (!cartIcon) return;

  const sourceRect = sourceImage.getBoundingClientRect();
  const targetRect = cartIcon.getBoundingClientRect();
  if (!sourceRect.width || !sourceRect.height) return;

  const clone = sourceImage.cloneNode(true);
  clone.style.position = "fixed";
  clone.style.left = `${sourceRect.left}px`;
  clone.style.top = `${sourceRect.top}px`;
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;
  clone.style.objectFit = "cover";
  clone.style.borderRadius = "8px";
  clone.style.zIndex = "9999";
  clone.style.pointerEvents = "none";
  clone.style.transition = "transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 650ms ease";
  clone.style.transformOrigin = "center center";

  document.body.appendChild(clone);

  const fromCenterX = sourceRect.left + sourceRect.width / 2;
  const fromCenterY = sourceRect.top + sourceRect.height / 2;
  const toCenterX = targetRect.left + targetRect.width / 2;
  const toCenterY = targetRect.top + targetRect.height / 2;
  const deltaX = toCenterX - fromCenterX;
  const deltaY = toCenterY - fromCenterY;

  window.requestAnimationFrame(() => {
    clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.12)`;
    clone.style.opacity = "0.25";
  });

  const cleanup = () => {
    if (clone.parentNode) clone.parentNode.removeChild(clone);
  };
  clone.addEventListener("transitionend", cleanup, { once: true });
  setTimeout(cleanup, 800);
}
