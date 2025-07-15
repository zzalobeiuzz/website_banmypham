import axios from "axios";
import cheerio from "cheerio";

const downloadImageToServer = async (url) => {
  try {
    const formData = new FormData();
    formData.append("imageUrl", url);

    // Gọi API backend tải ảnh và trả về đường dẫn mới
    const res = await axios.post("http://localhost:5000/api/admin/products/save_external_image", formData);
    return res.data.newUrl;
  } catch (e) {
    console.error("❌ Lỗi tải ảnh external:", e);
    return url; // Nếu lỗi, giữ nguyên src cũ
  }
};

export const handleHtmlImages = async (htmlContent) => {
  const $ = cheerio.load(htmlContent);
  const images = $("img");

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = $(img).attr("src");

    if (src && src.startsWith("http")) {
      // Gọi API tải ảnh
      const newSrc = await downloadImageToServer(src);
      $(img).attr("src", newSrc);
    }
  }

  return $.html();
};
