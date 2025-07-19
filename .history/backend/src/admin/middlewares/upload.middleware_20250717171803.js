// upload.js
const multer = require("multer");

const storage = multer.memoryStorage(); // ❗ Không lưu ảnh ra đĩa

const upload = multer({ storage });

module.exports = upload;
