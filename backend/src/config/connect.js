require("dotenv").config({ path: "../../private.env" });
const sql = require("mssql");

// 🔧 Connection pool configuration
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
  },
  // 📊 Connection pool sizing (tuned for production)
  pool: {
    min: 2,                  // Minimum idle connections
    max: 20,                 // Maximum concurrent connections
    idleTimeoutMillis: 30000, // 30s idle timeout
  },
  // ⏱️ Request timeout
  requestTimeout: 30000,     // 30 second timeout per request
  connectionTimeout: 15000,  // 15 second connection timeout
};

// Global pool to reuse connections
let pool = null;
let connectingPromise = null;
let poolMetrics = {
  created: null,
  totalRequests: 0,
  activeConnections: 0,
  lastError: null,
};

// 🔌 Connection function with better error handling
async function connectDB() {
  try {
    if (pool && pool.connected) {
      poolMetrics.totalRequests++;
      return pool;
    }

    if (!connectingPromise) {
      connectingPromise = (async () => {
        if (pool) {
          try {
            await pool.close();
          } catch (closeErr) {
            // Ignore close errors while rebuilding pool
          }
          pool = null;
        }

        const newPool = new sql.ConnectionPool(config);
        newPool.on("error", (err) => {
          poolMetrics.lastError = {
            message: err.message,
            timestamp: new Date(),
          };
          console.error("❌ SQL Pool Error:", err.message);
        });

        await newPool.connect();
        pool = newPool;
        poolMetrics.created = new Date();
        console.log("✅ Đã kết nối thành công với Database (min:2, max:20)");
      })().finally(() => {
        connectingPromise = null;
      });
    }

    await connectingPromise;
    poolMetrics.totalRequests++;
    return pool;
  } catch (err) {
    poolMetrics.lastError = {
      message: err.message,
      timestamp: new Date(),
    };
    console.error("❌ DB Connection Error:", err.message);
    throw err;
  }
}

async function resetDBPool() {
  if (!pool) return;

  try {
    await pool.close();
  } catch (err) {
    // Ignore close errors during reset
  } finally {
    pool = null;
  }
}

// 📊 Pool metrics endpoint (for monitoring)
function getPoolMetrics() {
  if (!pool) return { status: "disconnected" };
  
  return {
    status: pool.connected ? "connected" : "disconnected",
    createdAt: poolMetrics.created,
    totalRequests: poolMetrics.totalRequests,
    requestTimeout: config.requestTimeout,
    connectionTimeout: config.connectionTimeout,
    poolConfig: config.pool,
    lastError: poolMetrics.lastError,
  };
}

module.exports = { connectDB, resetDBPool, sql, config, getPoolMetrics };
