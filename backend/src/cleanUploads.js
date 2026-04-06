const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "..", "uploads");

const cleanUploads = () => {
  if (!fs.existsSync(uploadDir)) {
    console.warn("[cleanUploads] Upload directory not found:", uploadDir);
    return;
  }

  const files = fs.readdirSync(uploadDir, { withFileTypes: true });
  const now = Date.now();

  files.forEach((entry) => {
    if (!entry.isFile()) return;

    const filePath = path.join(uploadDir, entry.name);
    fs.stat(filePath, (err, stats) => {
      if (err) return console.error("Stat error:", err);

      // Nếu file cũ hơn 1 ngày
      if (now - stats.mtimeMs >  60 * 1000) {
        fs.unlink(filePath, (err) => {
          if (err) console.error("Delete error:", err);
          else console.log("✅ Deleted old file:", entry.name);
        });
      }
    });
  });
};

module.exports = cleanUploads;
