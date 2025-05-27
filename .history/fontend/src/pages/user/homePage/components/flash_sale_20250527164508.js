const handleMouseMove = useCallback((e) => {
  if (e.buttons !== 1) return; // Chỉ xử lý khi chuột được giữ

  const deltaX = e.clientX - startX.current; // Tính độ lệch của chuột
  const maxTranslateX = -(products.length * ITEM_WIDTH - VISIBLE_COUNT * ITEM_WIDTH); // Tính giá trị dịch chuyển tối đa
  let newTranslateX = currentTranslateX.current + deltaX; // Cập nhật dịch chuyển

  // Nếu chuột di chuyển qua sản phẩm, cập nhật để di chuyển sang sản phẩm tiếp theo
  if (newTranslateX < maxTranslateX) {
    newTranslateX = maxTranslateX; // Không cho dịch chuyển vượt quá cuối
  } else if (newTranslateX > 0) {
    newTranslateX = 0; // Không cho dịch chuyển vượt quá đầu
  }

  // Tính toán xem có nên chuyển sang sản phẩm tiếp theo hay không
  const itemMoved = Math.abs(newTranslateX) >= ITEM_WIDTH;

  if (itemMoved) {
    // Dịch chuyển sang sản phẩm tiếp theo
    const movedProducts = products.slice(1); // Loại bỏ sản phẩm đầu tiên
    const nextProducts = [...movedProducts, products[0]]; // Đặt sản phẩm đầu tiên vào cuối danh sách
    setTranslateX(0); // Đặt lại vị trí về 0 sau khi chuyển
    // Cập nhật lại danh sách sản phẩm, đưa sản phẩm mới vào vị trí đầu tiên
    products = nextProducts;
  } else {
    // Tiến hành cập nhật vị trí dịch chuyển
    setTranslateX(newTranslateX);
  }

  if (animationFrameId.current) {
    cancelAnimationFrame(animationFrameId.current); // Hủy frame cũ
  }

  animationFrameId.current = requestAnimationFrame(() => {
    setTranslateX(newTranslateX); // Cập nhật vị trí dịch chuyển
  });
}, [products]);

const handleMouseUp = () => {
  containerRef.current.removeEventListener('mousemove', handleMouseMove);
  containerRef.current.removeEventListener('mouseup', handleMouseUp);
  containerRef.current.removeEventListener('mouseleave', handleMouseUp);

  // Kiểm tra nếu cần chuyển sang sản phẩm tiếp theo sau khi thả chuột
  const itemMoved = Math.abs(translateX) >= ITEM_WIDTH;
  if (itemMoved) {
    const movedProducts = products.slice(1); // Loại bỏ sản phẩm đầu tiên
    const nextProducts = [...movedProducts, products[0]]; // Đặt sản phẩm đầu tiên vào cuối danh sách
    setTranslateX(0); // Đặt lại vị trí về 0 sau khi chuyển
    // Cập nhật lại danh sách sản phẩm
    products = nextProducts;
  }
};
