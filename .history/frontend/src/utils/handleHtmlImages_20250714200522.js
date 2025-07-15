import { load } from "cheerio";
import { API_BASE } from "../constants";

/**
 * Hàm xử lý toàn bộ HTML, gửi tất cả ảnh (URL + base64) lên server
 * Server sẽ tải về, lưu, trả lại URL mới để thay vào HTML
 */
export const handleHtmlImagesBatch = async (htmlArr) => {
    const allSrcs = [];
    const cheerios = [];

    // Bước 1: Duyệt qua từng HTML, lấy toàn bộ ảnh (http hoặc base64)
    htmlArr.forEach((html) => {
        const $ = load(html);
        $("img").each((_, img) => {
            const src = $(img).attr("src");
            if (src && (src.startsWith("http") || src.startsWith("data:image/"))) {
                allSrcs.push(src);
            }
        });
        cheerios.push($);
    });

    // Nếu không có ảnh, trả lại nguyên HTML
    if (allSrcs.length === 0) return htmlArr;

    console.log("👉 Danh sách ảnh gửi lên backend:", allSrcs);

    // Bước 2: Gửi danh sách ảnh lên server để lưu
    const res = await fetch(`${API_BASE}/api/admin/products/save_external_images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: allSrcs }),
    });

    if (!res.ok) {
        throw new Error("Lỗi upload ảnh về server");
    }

    const data = await res.json();

    if (!data.newUrls || !Array.isArray(data.newUrls)) {
        console.warn("❗ Server không trả về danh sách URL mới hợp lệ");
        return htmlArr;
    }

    // Bước 3: Cập nhật lại src ảnh trong từng HTML
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
