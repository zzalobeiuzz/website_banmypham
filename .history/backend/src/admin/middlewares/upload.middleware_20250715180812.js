const multer = require("multer");

const storage = multer.diskStorage({
  console.log("👉 File upload:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
// thư mục lưu ảnh
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  // limits: {
  //   fieldSize: 25 * 1024 * 1024, // 25 MB, tuỳ chỉnh
  // },
});

module.exports = upload;


