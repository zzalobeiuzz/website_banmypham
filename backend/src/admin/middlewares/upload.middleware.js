// upload.js
const multer = require("multer");

const storage = multer.memoryStorage(); // ❗ Không lưu ảnh ra đĩa

const upload = multer({
	storage,
	limits: {
		fieldSize: 15 * 1024 * 1024,
		fileSize: 10 * 1024 * 1024,
	},
});

module.exports = upload;
