const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "./uploads");

const cleanUploads = () => {
  const files = fs.readdirSync(uploadDir);
  const now = Date.now();

  files.forEach((file) => {
    const filePath = path.join(uploadDir, file);
    fs.stat(filePath, (err, stats) => {
      if (err) return console.error("Stat error:", err);

      // Nếu file cũ hơn 1 ngày
        fs.unlink(filePath, (err) => {
          if (err) console.error("Delete error:", err);
          else console.log("✅ Deleted old file:", file);
        });
      }
    });
  });
};

module.exports = cleanUploads;
