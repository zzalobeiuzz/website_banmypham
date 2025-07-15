import cheerio from "cheerio";
import { API_BASE } from "../../../constants";

/**
 * Hàm xử lý HTML, thay đổi tất cả ảnh <img src="http..."> thành ảnh đã lưu về server
 * @param {string} htmlContent - Nội dung HTML cần xử lý
 * @param {function} request - Hàm request lấy từ useHttp
 * @returns {Promise<string>} - HTML mới đã thay đổi URL ảnh
 */
export const handleHtmlImages = async (htmlContent, request) => {
  const $ = cheerio.load(htmlContent);
  const images = $("img");

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = $(img).attr("src");

    if (src && src.startsWith("http")) {
      try {
        // Tạo formData
        const formData = new FormData();
        formData.append("imageUrl", src);

        // Gửi request dùng hook useHttp
        const res = await request(
          "POST",
          `${API_BASE}/api/admin/products/save_external_image`,
          formData
        );

        // Giả sử backend trả về { newUrl: "..." }
        if (res.newUrl) {
          $(img).attr("src", res.newUrl);
        }
      } catch (err) {
        console.error("❌ Lỗi tải ảnh:", src, err);
        // Nếu lỗi, giữ nguyên URL cũ
      }
    }
  }

  // Trả về HTML mới
  return $.html();
};
