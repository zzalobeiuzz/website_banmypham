const { connectDB } = require("../../config/connect");

const parseJsonObject = (value) => {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const isEventInDateRange = (event) => {
  const now = new Date();
  const startDate = event.start_date ? new Date(event.start_date) : null;
  const endDate = event.end_date ? new Date(event.end_date) : null;

  if (startDate && !Number.isNaN(startDate.getTime()) && now < startDate) return false;
  if (endDate && !Number.isNaN(endDate.getTime()) && now > endDate) return false;
  return true;
};

exports.getHomeBannerEvents = async () => {
  const pool = await connectDB();

  const result = await pool.request().query(`
    SELECT
      id,
      code,
      title,
      description,
      banner_image,
      start_date,
      end_date,
      status,
      metadata,
      created_at
    FROM SALE_EVENT
    WHERE status = 1
      AND banner_image IS NOT NULL
      AND LTRIM(RTRIM(CAST(banner_image AS NVARCHAR(500)))) <> ''
    ORDER BY created_at DESC, id DESC
  `);

  return (result.recordset || [])
    .filter(isEventInDateRange)
    .map((event) => ({
      ...event,
      metadata: parseJsonObject(event.metadata),
    }))
    .filter((event) => event.metadata?.showOnHome === true);
};
