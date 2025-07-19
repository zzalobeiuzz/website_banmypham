const cheerio = require("cheerio");
const path = require("path");

exports.processHtmlWithPrefix = function (htmlString, prefix = "img") {
  const $ = cheerio.load(htmlString);
  const imageMap = [];

  $("img").each((_, img) => {
    const oldSrc = $(img).attr("src");

    // ✅ Nếu là ảnh base64
    if (oldSrc && /^data:image\/(png|jpeg|jpg);base64,/.test(oldSrc)) {
      const match = oldSrc.match(/^data:image\/(png|jpeg|jpg);base64,/);
      const ext = match[1] === "jpeg" ? "jpg" : match[1]; // dùng jpg thay vì jpeg
      const newFileName = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
      const newSrc = `/uploads/assets/pictures/${newFileName}`;

      $(img).attr("src", newSrc);
      imageMap.push({ oldSrc, newSrc, isBase64: true });
    }

    // ✅ Nếu là ảnh từ URL (http/https)
    else if (/^https?:\/\/.+/i.test(oldSrc)) {
      const baseName = path.basename(oldSrc, path.extname(oldSrc));
      const newFileName = `${prefix}_${baseName}.jpg`;
      const newSrc = `/uploads/assets/pictures/${newFileName}`;

      $(img).attr("src", newSrc);
      imageMap.push({ oldSrc, newSrc, isBase64: false });
    }
  });

  return {
    html: $.html(),
    imageMap
  };
};
