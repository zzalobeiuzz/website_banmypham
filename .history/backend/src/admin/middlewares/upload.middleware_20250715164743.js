const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "C:\\website_banmypham_2\\frontend\\public\\assets\\pictures");
  },
  filename: function (req, file, cb) {
    const baseName = path.basename(file.originalname, path.extname(file.originalname));
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, `${baseName}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
