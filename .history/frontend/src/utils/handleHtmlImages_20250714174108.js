import { load } from "cheerio";
in

export const handleHtmlImagesBatch = async (htmlArr, request) => {
  const allUrls = [];
  const cheerios = [];

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

  const res = await request("POST", "/api/admin/products/save_external_images", { imageUrls: allUrls });

  if (!res.newUrls) return htmlArr;

  let imgIndex = 0;
  const updatedHtmlArr = htmlArr.map(($html, i) => {
    const $ = cheerios[i];
    $("img").each((_, img) => {
      if (res.newUrls[imgIndex]) {
        $(img).attr("src", res.newUrls[imgIndex]);
      }
      imgIndex++;
    });
    return $.html();
  });

  return updatedHtmlArr;
};
