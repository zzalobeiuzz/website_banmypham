//Hàm tạo code gửi mail
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }