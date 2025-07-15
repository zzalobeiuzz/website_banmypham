const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "C:\\website_banmypham_2\\frontend\\public\\assets\\pictures");
// thư mục lưu ảnh
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // ✅ giữ nguyên tên file, cho phép ghi đè
  },
});

const upload = multer({
  
  storage: storage,
  // limits: {
  //   fieldSize: 25 * 1024 * 1024, // 25 MB, tuỳ chỉnh
  // },
});

module.exports = upload;
