const cheerio = require("cheerio");
const path = require("path");

function processHtmlWithPrefix(htmlString, prefix = "img") {
  const $ = cheerio.load(htmlString);
  const imageMap = [];

  $("img").each((_, img) => {
    const oldSrc = $(img).attr("src");

    // Chỉ xử lý ảnh từ URL hợp lệ
    if (oldSrc && /^https?:\/\/.+/i.test(oldSrc)) {
      // Lấy tên gốc không đuôi
      const baseName = path.basename(oldSrc, path.extname(oldSrc));
      const newFileName = `${prefix}_${baseName}.jpg`;
      const newSrc = `/uploads/assets/pictures/${newFileName}`;

      // Cập nhật lại src trong HTML
      $(img).attr("src", newSrc);

      imageMap.push({ oldSrc, newSrc });
    }
  });

  return {
    html: $.html(),
    imageMap
  };
}

