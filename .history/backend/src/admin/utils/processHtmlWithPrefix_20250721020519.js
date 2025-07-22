const cheerio = require("cheerio");
const path = require("path");

/**
 * Phân tích HTML có chứa ảnh, thay đổi đường dẫn <img src=""> và gom lại danh sách ảnh cần xử lý (base64 hoặc url).
 *
 * @param {string} htmlString - Nội dung HTML có chứa thẻ <img>
 * @param {string} prefix - Tiền tố đặt tên file ảnh mới
 * @returns {{
 *   html: string,                       // HTML đã cập nhật đường dẫn ảnh
 *   imageMap: {                         // Danh sách ảnh cần xử lý
 *     oldSrc: string,                   // Đường dẫn cũ (base64 hoặc url)
 *     newSrc: string,                   // Đường dẫn mới để gán vào HTML
 *     isBase64: boolean                 // Có phải là ảnh base64 không
 *   }[]
 * }}
 */

exports.processHtmlWithPrefix = function (htmlString, prefix = "img", fieldName = "") {
  const $ = cheerio.load(htmlString); // Parse HTML thành DOM sử dụng cheerio
  const imageMap = [];                // Gom tất cả ảnh cần xử lý ở đây

  $("img").each((_, img) => {
    const oldSrc = $(img).attr("src");

    // ✅ Ảnh base64
    if (oldSrc && /^data:image\/([a-zA-Z0-9+.-]+);base64,/.test(oldSrc)) {
      const match = oldSrc.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/);
      let ext = match[1];

      // chuẩn hóa lại extension nếu cần
      if (ext === "jpeg") ext = "jpg";
      if (ext === "svg+xml") ext = "svg";

      const newFileName = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
      const newSrc = `http://localhost:5000/uploads/assets/pictures/${fieldName}/${newFileName}`;
      $(img).attr("src", newSrc);
      imageMap.push({ oldSrc, newSrc, isBase64: true });
    }

    // ✅ Ảnh từ URL thật
    else if (/^https?:\/\/.+/i.test(oldSrc)) {
      const baseName = path.basename(oldSrc, path.extname(oldSrc));
      const newFileName = `${prefix}_${baseName}.jpg`;
      const newSrc = `http://localhost:5000/uploads/assets/pictures/${fieldName}/${newFileName}`;

      $(img).attr("src", newSrc);
      imageMap.push({ oldSrc, newSrc, isBase64: false });
    }

    // ❌ Ảnh nội bộ hoặc định dạng không xác định → bỏ qua
  });

  return {
    html: $.html(),
    imageMap
  };
};
