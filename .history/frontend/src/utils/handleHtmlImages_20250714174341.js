import { load } from "cheerio";
import { API_BASE } from "../constants";

export const handleHtmlImagesBatch = async (htmlArr) => {
  const allUrls = [];
  const cheerios = [];

  // Duyệt qua từng HTML để gom URL và giữ cheerio instance
  htmlArr.forEach((html) => {
    const $ = load(html);
    const imgs = $("img");
    const urls = [];
    imgs.each((_, img) => {
      const src = $(img).attr("src");
      if (src && src.startsWith("http")) {
        urls.push(src);
      }
    });
    allUrls.push(...urls);
    cheerios.push($);
  });

  if (allUrls.length === 0) return htmlArr;

  // Tạo formData
  const formData = new FormData();
  formData.append("imageUrls", JSON.stringify(allUrls));

  // Gửi request
  const res = await fetch(`${API_BASE}/api/admin/productsrouter.post("/save_external_images", saveExternalImage);
`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!data.newUrls) return htmlArr;

  let imgIndex = 0;
  const updatedHtmlArr = htmlArr.map((html, i) => {
    const $ = cheerios[i];
    $("img").each((_, img) => {
      if (data.newUrls[imgIndex]) {
        $(img).attr("src", data.newUrls[imgIndex]);
      }
      imgIndex++;
    });
    return $.html();
  });

  return updatedHtmlArr;
};
