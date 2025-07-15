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
    
    console.log("✅ In FormData:");

    for (const [key, value] of formData.entries()) {
        console.log("👉", key, value);
    }

    // Gửi request
    const res = await fetch(`${API_BASE}/api/admin/products/save_external_images`, {
        method: "POST",
        body: formData,
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
