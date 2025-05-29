function removeVietnameseTones(str) {
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Bỏ dấu
  str = str.replace(/đ/g, 'd').replace(/Đ/g, 'D'); // Thay đ thành d
  return str;
}