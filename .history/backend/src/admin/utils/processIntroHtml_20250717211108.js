// utils/imageDownloader.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

exports.downloadImage = async (oldSrc, newSrc) => {
  const fullPath = path.join(__dirname, "../public", newSrc);
  const writer = fs.createWriteStream(fullPath);

  const res = await axios({
    method: "GET",
    url: oldSrc,
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    res.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};
