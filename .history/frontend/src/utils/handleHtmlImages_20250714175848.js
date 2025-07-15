import { load } from "cheerio";
import { API_BASE } from "../constants";

export const handleHtmlImagesBatch = async (htmlArr) => {
    const allUrls = [];
    const cheerios = [];

    htmlArr.forEach((html) => {
        const $ = load(html);
        $("img").each((_, img) => {
            const src = $(img).attr("src");
            if (src && src.startsWith("http")) {
                allUrls.push(src);
            }
        });
        cheerios.push($);
    });

    if (allUrls.length === 0) return htmlArr;

    console.log("👉 imageUrls", allUrls);

    const res = await fetch(`${API_BASE}/api/admin/products/save_external_images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: allUrls }),
    });

    if (!res.ok) {
        throw new Error("Lỗi upload ảnh về server");
    }

    const data = await res.json();

    if (!data.newUrls || !Array.isArray(data.newUrls)) {
        return htmlArr;
    }

    let imgIndex = 0;
    const updatedHtmlArr = htmlArr.map((_, i) => {
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

