const cheerio = require("cheerio"); // Thư viện để thao tác với HTML giống như jQuery
const path = require("path");       // Module xử lý đường dẫn file (lấy tên, phần mở rộng, nối đường dẫn, v.v.)

// Hàm xử lý HTML chứa ảnh, đổi đường dẫn ảnh và gom lại danh sách ảnh cần tải
exports.processHtmlWithPrefix = function (htmlString, prefix = "img") {
  const $ = cheerio.load(htmlString); // Parse HTML thành dạng DOM có thể duyệt
  const imageMap = []; // Danh sách các ảnh cần tải: [{ oldSrc, newSrc }]

  // Duyệt qua tất cả các thẻ <img>
  $("img").each((_, img) => {
    const oldSrc = $(img).attr("src"); // Lấy đường dẫn ảnh gốc từ thuộc tính src

    // Chỉ xử lý các ảnh có đường dẫn HTTP/HTTPS hợp lệ (tránh ảnh local hoặc base64)
    if (oldSrc && /^https?:\/\/.+/i.test(oldSrc)) {
      // Lấy tên file không có đuôi (vd: https://.../abc123.png → abc123)
      const baseName = path.basename(oldSrc, path.extname(oldSrc));

      // Tạo tên mới cho ảnh với prefix (vd: intro_abc123.jpg)
      const newFileName = `${prefix}_${baseName}.jpg`;

      // Tạo đường dẫn mới cho ảnh (dạng ảo, lưu vào /uploads/assets/pictures)
      const newSrc = `/uploads/assets/pictures/${newFileName}`;

      // Gán đường dẫn ảnh mới vào lại thuộc tính src của <img>
      $(img).attr("src", newSrc);

      // Lưu thông tin ánh xạ ảnh để xử lý tải ảnh sau này
      imageMap.push({ oldSrc, newSrc });
    }
  });

  return {
    html: $.html(),     // Trả về HTML đã được cập nhật src ảnh mới
    imageMap            // Trả về danh sách ảnh đã xử lý (để gọi download ảnh)
  };
};
