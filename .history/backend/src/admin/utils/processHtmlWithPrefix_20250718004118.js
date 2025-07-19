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
exports.processHtmlWithPrefix = function (htmlString, prefix = "img") {
  const $ = cheerio.load(htmlString); // Parse HTML thành DOM sử dụng cheerio
  const imageMap = [];                // Gom tất cả ảnh cần xử lý ở đây

  $("img").each((_, img) => {
    const oldSrc = $(img).attr("src"); // Lấy đường dẫn ảnh ban đầu từ HTML
    console.log("aaaaaaaaaaaaaaaa")
    // ✅ Ảnh được dán dưới dạng base64 (thường là người dùng chọn ảnh từ máy)
    if (oldSrc && /^data:image\/(png|jpeg|jpg);base64,/.test(oldSrc)) {
      console.log("aaaaaaaaaaaaaaaa")
      const match = oldSrc.match(/^data:image\/(png|jpeg|jpg);base64,/); // lấy đuôi ảnh
      const ext = match[1] === "jpeg" ? "jpg" : match[1]; // chuẩn hóa jpeg → jpg

      // Đặt tên file mới với thời gian hiện tại và số random (tránh trùng)
      const newFileName = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
      const newSrc = `/uploads/assets/pictures/${newFileName}`; // đường dẫn ảo

      $(img).attr("src", newSrc); // thay src trong HTML
      imageMap.push({ oldSrc, newSrc, isBase64: true }); // thêm vào danh sách ảnh
    }

    // ✅ Ảnh từ URL thực (http hoặc https) – có thể từ Internet hoặc đã tải lên sẵn
    else if (/^https?:\/\/.+/i.test(oldSrc)) {
      const baseName = path.basename(oldSrc, path.extname(oldSrc)); // tên file không đuôi
      const newFileName = `${prefix}_${baseName}.jpg`;              // đặt lại tên file
      const newSrc = `/uploads/assets/pictures/${newFileName}`;     // đường dẫn mới

      $(img).attr("src", newSrc); // thay src trong HTML
      imageMap.push({ oldSrc, newSrc, isBase64: false }); // thêm vào danh sách ảnh
    }

    // ❌ Nếu là ảnh nội bộ (vd: src="/img/x.png") hoặc định dạng không xác định → bỏ qua
  });
  return {
    html: $.html(),  // trả về HTML đã cập nhật đường dẫn
    imageMap         // trả về danh sách ảnh cần xử lý tiếp
  };
};
