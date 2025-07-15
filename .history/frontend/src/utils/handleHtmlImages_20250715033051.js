import axios from "axios";
import { load } from "cheerio";
import { API_BASE } from "../constants";

export const handleHtmlImagesBatch = async (htmlArr) => {
    const allSrcs = [];
    const cheerios = [];

    // Bước 1: Lấy toàn bộ ảnh từ mỗi HTML
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

    // Không có ảnh thì trả lại nguyên
    if (allSrcs.length === 0) return htmlArr;

    console.log("👉 Danh sách ảnh gửi lên backend:", allSrcs);

    try {
        // Bước 2: Gửi lên server
        const res = await axios.post(
            `${API_BASE}/api/admin/products/save_external_images`,
            { imageUrls: allSrcs },
            {
                headers: { "Content-Type": "application/json" },
                withCredentials: true, // ✅ tương đương credentials: "include" bên fetch
            }
        );

        const data = res.data;
        console.log("✅ Server trả về:", data);

        if (!data.newUrls || !Array.isArray(data.newUrls)) {
            console.warn("❗ Server không trả về danh sách URL mới hợp lệ");
            return htmlArr;
        }

        // Bước 3: Cập nhật src trong HTML
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

        console.log("✅ updatedHtmlArr", updatedHtmlArr);
        return updatedHtmlArr;
    } catch (error) {
        // Log chi tiết lỗi
        console.error("❌ Lỗi khi upload ảnh:", {
            message: error.message,
            name: error.name,
            stack: error.stack,
            response: error.response ? {
                status: error.response.status,
                data: error.response.data,
            } : null,
        });
        return htmlArr; // Trả về HTML gốc nếu có lỗi để không làm hỏng ứng dụn
        //throw new Error("Lỗi upload ảnh về server");
    }
};
