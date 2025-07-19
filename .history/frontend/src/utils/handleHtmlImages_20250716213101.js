import axios from "axios";
import fs from "fs";
import path from "path";

export const handleHtmlImagesBatch = async (req, res) => {
  const { imageUrls } = req.body;
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  const uploadsFolder = path.join(__dirname, "../../uploads/assets/pictures");

  if (!fs.existsSync(uploadsFolder)) {
    fs.mkdirSync(uploadsFolder, { recursive: true });
  }

  const newUrls = [];
  const internalImages = [];

  for (const imageUrl of imageUrls) {
    try {
      // ✅ Check nếu URL là nội bộ (đã thuộc uploads)
      if (imageUrl.startsWith(`${hostUrl}/uploads`)) {
        console.log("✅ Ảnh nội bộ đã tồn tại:", imageUrl);

        // Lấy tên file từ URL
        const fileName = imageUrl.split("/").pop();
        internalImages.push(fileName);

        // Đẩy URL gốc luôn vào danh sách trả về
        newUrls.push(imageUrl);
        continue;
      }

      // ✅ Nếu ảnh ngoài, tải và lưu
      const response = await axios({
        method: "get",
        url: imageUrl,
        responseType: "stream",
      });

      const fileName = Date.now() + "-" + path.basename(imageUrl).split("?")[0];
      const filePath = path.join(uploadsFolder, fileName);

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const newUrl = `${hostUrl}/uploads/assets/pictures/${fileName}`;
      console.log("✅ Ảnh mới lưu:", newUrl);
      newUrls.push(newUrl);
    } catch (error) {
      console.error("❌ Lỗi lưu ảnh:", imageUrl, error.message);
      // Nếu lỗi, vẫn đẩy URL gốc (hoặc null tuỳ anh muốn)
      newUrls.push(imageUrl);
    }
  }

  console.log("👉 Danh sách ảnh nội bộ đã tồn tại:", internalImages);

  return res.json({ success: true, newUrls });
};
