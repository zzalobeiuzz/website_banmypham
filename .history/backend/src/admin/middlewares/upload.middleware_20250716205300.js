const multer = require("multer");

const storage = multer.diskStorage({
 
  destination: function (req, file, cb) {
    console.log("👉 File upload:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
    cb(null, "C:\\website_banmypham_2\\backend\\uploads\\assets\\pictures");
// thư mục lưu ảnh
  },
});

const upload = multer({
  storage: storage,
  // limits: {
  //   fieldSize: 25 * 1024 * 1024, // 25 MB, tuỳ chỉnh
  // },
});

module.exports = upload;


