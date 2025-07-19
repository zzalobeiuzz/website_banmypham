const multer = require("multer");

const storage = multer.diskStorage({
 
  destination: function (req, file, cb) {
    cb(null, "C:\\website_banmypham_2\\backend\\uploads\\assets\\pictures");
// thư mục lưu ảnh
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,

});

module.exports = upload;


