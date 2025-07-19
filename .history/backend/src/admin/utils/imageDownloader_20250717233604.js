const axios = require("axios");
const fs = require("fs");
const path = require("path");

exports.downloadImage = async (oldSrc, newSrc) => {
  try {
    console.log("oldSrc"+oldSrc)
    console.log("newSrc"+newSrc)
    const fullPath = path.join(__dirname, "../", newSrc);

    // Nếu ảnh đã tồn tại, bỏ qua
    if (fs.existsSync(fullPath)) {
      console.log("⚠️ Ảnh đã tồn tại, bỏ qua:", newSrc);
      return;
    }

    // Đảm bảo thư mục tồn tại
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Tải ảnh từ oldSrc
    const response = await axios({
      method: "GET",
      url: oldSrc,
      responseType: "stream",
    });

    // Ghi ảnh vào máy chủ
    const writer = fs.createWriteStream(fullPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (err) {
    console.error("❌ Lỗi tải ảnh:", oldSrc, "→", err.message);
    throw err;
  }
};
