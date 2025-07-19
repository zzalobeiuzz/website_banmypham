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
    console.log("aaaaaaaaaaaaaaaa "+oldSrc)
    // ✅ Ảnh được dán dưới dạng base64 (thường là người dùng chọn ảnh từ máy)
    if (oldSrc && /^data:image\/([a-zA-Z0-9+.-]+);base64,/.test(oldSrc)) {
      console.log("✅ Base64 ảnh:", oldSrc.slice(0, 30)); // in thử 30 ký tự đầu
      const match = oldSrc.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/); // sửa regex
      let ext = match[1];
    
      // chuẩn hóa lại extension nếu cần
      if (ext === "jpeg") ext = "jpg";
      if (ext === "svg+xml") ext = "svg";
    
      const newFileName = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
      const newSrc = `/uploads/assets/pictures/${newFileName}`;
    
      $(img).attr("src", newSrc);
      imageMap.push({ oldSrc, newSrc, isBase64: true });
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
