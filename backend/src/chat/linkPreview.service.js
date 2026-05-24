const axios = require("axios");
const cheerio = require("cheerio");

const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 280;

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const truncate = (value, maxLength) => {
  // Rút gọn text để preview không bị quá dài
  const text = normalizeText(value);
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
};

const resolveAbsoluteUrl = (baseUrl, maybeUrl) => {
  const value = normalizeText(maybeUrl);
  if (!value) return "";

  try {
    return new URL(value, baseUrl).toString();
  } catch (error) {
    return "";
  }
};

const pickMeta = ($, selectors) => {
  // Ưu tiên OpenGraph, sau đó mới tới các meta tag khác
  for (const selector of selectors) {
    const content = normalizeText($(selector).attr("content"));
    if (content) return content;
  }
  return "";
};

const isYouTubeUrl = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    return host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be";
  } catch (error) {
    return false;
  }
};

const isFacebookUrl = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    return host === "facebook.com" || host === "m.facebook.com" || host === "fb.com";
  } catch (error) {
    return false;
  }
};

const buildFallbackPreview = (parsedUrl) => {
  const pathname = normalizeText(parsedUrl.pathname).replace(/^\/+|\/+$/g, "");
  const pathLabel = pathname
    ? pathname
        .split("/")
        .filter(Boolean)
        .pop()
        .replace(/[._-]+/g, " ")
    : "";

  const hostname = parsedUrl.hostname.replace(/^www\./i, "");
  const title = truncate(pathLabel || hostname, MAX_TITLE_LENGTH) || hostname;
  const siteName = isFacebookUrl(parsedUrl.toString()) ? "Facebook" : truncate(hostname, 80);

  return {
    url: parsedUrl.toString(),
    title,
    description: "",
    image: "",
    siteName,
  };
};

const getYouTubePreview = async (url) => {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const response = await axios.get(oembedUrl, {
    timeout: 5000,
    responseType: "json",
    validateStatus: (status) => status >= 200 && status < 400,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; website_banmypham/1.0)",
      Accept: "application/json,text/plain,*/*",
    },
  });

  const data = response.data || {};
  const title = truncate(data.title, MAX_TITLE_LENGTH) || "YouTube";
  const siteName = truncate(data.author_name || "YouTube", 80);

  return {
    url,
    title,
    description: "",
    image: normalizeText(data.thumbnail_url),
    siteName,
  };
};

exports.getLinkPreview = async ({ url }) => {
  const rawUrl = normalizeText(url);
  if (!rawUrl) {
    throw new Error("Thiếu URL cần xem trước.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch (error) {
    throw new Error("URL không hợp lệ.");
  }

  if (!/^https?:$/i.test(parsedUrl.protocol)) {
    // Chỉ cho phép link http/https để tránh kiểu URL không an toàn
    throw new Error("Chỉ hỗ trợ URL http hoặc https.");
  }

  if (isYouTubeUrl(parsedUrl.toString())) {
    try {
      return await getYouTubePreview(parsedUrl.toString());
    } catch (error) {
      // If oEmbed fails, fall back to HTML scraping below.
    }
  }

  let response;
  try {
    response = await axios.get(parsedUrl.toString(), {
      timeout: 5000,
      responseType: "text",
      maxContentLength: 1024 * 1024,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; website_banmypham/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });
  } catch (error) {
    // Many Facebook pages block bot scraping. Return a safe fallback card instead of failing.
    return buildFallbackPreview(parsedUrl);
  }

  const html = String(response.data || "");
  const $ = cheerio.load(html);

  const title = truncate(
    pickMeta($, [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
    ]) || $("title").text(),
    MAX_TITLE_LENGTH,
  );

  const description = truncate(
    pickMeta($, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]),
    MAX_DESCRIPTION_LENGTH,
  );

  const image = resolveAbsoluteUrl(parsedUrl.toString(),
    pickMeta($, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[property="og:image:url"]',
    ]),
  );

  const siteName = truncate(
    pickMeta($, [
      'meta[property="og:site_name"]',
      'meta[name="application-name"]',
    ]) || parsedUrl.hostname.replace(/^www\./i, ""),
    80,
  );

  if (!title && !description && !image) {
    return buildFallbackPreview(parsedUrl);
  }

  if (!title && !description && !image && isYouTubeUrl(parsedUrl.toString())) {
    try {
      return await getYouTubePreview(parsedUrl.toString());
    } catch (error) {
      // ignore and continue with generic fallback
    }
  }

  return {
    url: parsedUrl.toString(),
    title: title || parsedUrl.hostname,
    description,
    image,
    siteName,
  };
};