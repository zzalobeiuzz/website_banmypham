const handleMouseUp = (e) => {
  endX.current = e.clientX;

  containerRef.current.removeEventListener('mousemove', handleMouseMove);
  containerRef.current.removeEventListener('mouseup', handleMouseUp);
  containerRef.current.removeEventListener('mouseleave', handleMouseUp);

  const deltaX = endX.current - startX.current; // Khoảng cách di chuyển
  const maxTranslateX = -(products.length * ITEM_WIDTH - VISIBLE_COUNT * ITEM_WIDTH);

  if (Math.abs(deltaX) < 30) {
    setTranslateX(currentTranslateX.current);
    return;
  }

  const direction = deltaX > 0 ? 1 : -1; // Kiểm tra hướng kéo, trái (-1) hoặc phải (1)

  // Nếu đã ở giới hạn, không tính toán thêm
  if (
    (currentTranslateX.current === 0 && direction > 0) || 
    (currentTranslateX.current === maxTranslateX && direction < 0)
  ) {
    console.log('Đã đạt giới hạn, không lướt thêm được.');
    return;
  }

  // Tính số lượng sản phẩm có thể lướt qua
  const itemsScrollable = Math.min(
    Math.floor((Math.abs(deltaX) - 70) / ITEM_WIDTH) + 1, // Nếu vượt ngưỡng 70px, tăng giá trị itemsScrolled
    Math.max(products.length - VISIBLE_COUNT, 0) // Giới hạn số sản phẩm có thể lướt qua
  );

  console.log('Sản phẩm đã lướt: ' + itemsScrollable);

  // Cập nhật tổng số sản phẩm đã lướt qua
  let newScrolledCount = scrolledItemsCount.current + direction * itemsScrollable;

  // Đặt lại về 0 nếu quay về trạng thái mặc định
  if (currentTranslateX.current - direction * itemsScrollable * ITEM_WIDTH === 0) {
    newScrolledCount = 0;
  }

  scrolledItemsCount.current = Math.max(0, newScrolledCount); // Ngăn giá trị âm
  console.log('Tổng sản phẩm đã lướt: ', scrolledItemsCount.current);

  // Cập nhật giá trị translateX
  const finalTranslateX = currentTranslateX.current - direction * itemsScrollable * ITEM_WIDTH;
  const clampedTranslateX = Math.max(Math.min(finalTranslateX, 0), maxTranslateX);

  setTranslateX(clampedTranslateX);
  currentTranslateX.current = clampedTranslateX;

  // Cập nhật các chỉ số active
  const newActiveIndexes = [];
  const activeIndexStart = Math.floor(Math.abs(clampedTranslateX) / ITEM_WIDTH);

  for (let i = 0; i < VISIBLE_COUNT; i++) {
    const index = activeIndexStart + i;
    if (index < products.length) {
      newActiveIndexes.push(index);
    }
  }

  setActiveIndexes(newActiveIndexes);
};
