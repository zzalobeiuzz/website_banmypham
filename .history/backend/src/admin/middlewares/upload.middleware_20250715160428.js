const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "C:\\website_banmypham_2\\frontend\\public\\assets\\pictures");
  },
  filename: function (req, file, cb) {
    // Lấy tên gốc (không có đuôi)
    const baseName = path.basename(file.originalname, path.extname(file.originalname));
    // Lấy phần mở rộng (ví dụ .png)
    const ext = path.extname(file.originalname);
    // Tạo suffix để đảm bảo duy nhất
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    // Gộp lại
    cb(null, `${baseName}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  // limits: {
  //   fieldSize: 25 * 1024 * 1024, // 25 MB nếu cần
  // },

