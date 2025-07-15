import { load } from "cheerio";
import { API_BASE } from "../constants";

export const handleHtmlImages = async (htmlContent, request) => {
  const $ = load(htmlContent);
  const images = $("img");

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = $(img).attr("src");
    if (src && src.startsWith("http")) {
      try {
        const formData = new FormData();
        formData.append("imageUrl", src);

        const res = await request("POST", `${API_BASE}/api/admin/products/save_external_image`, formData);
        if (res.newUrl) {
          $(img).attr("src", res.newUrl);
        }
      } catch (err) {
        console.error("❌ Lỗi tải ảnh external:", err);
      }
    }
  }
  return $.html();
};
