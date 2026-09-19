import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// In-memory fallback store
const memoryCache = new Map();

// Periodic cleanup of expired in-memory items every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    if (item.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}, 60000).unref(); // unref so it won't prevent Node process exit

let redisClient = null;
let isRedisAvailable = false;

try {
  redisClient = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,

    retryStrategy(times) {
      if (times > 3) {
        return null;
      }

      return Math.min(times * 500, 2000);
    },
  });

  redisClient.on("connect", () => {
    isRedisAvailable = true;
    console.log("Redis cache connected successfully.");
  });

  redisClient.on("ready", () => {
    isRedisAvailable = true;
  });

  redisClient.on("error", (err) => {
    // Suppress spammy unhandled error events; fallback to memory cache
    isRedisAvailable = false;
  });

  redisClient.on("close", () => {
    isRedisAvailable = false;
  });

  // Attempt initial non-blocking connection
  redisClient.connect().catch(() => {
    isRedisAvailable = false;
    // Quietly continue using in-memory cache
  });
} catch (err) {
  isRedisAvailable = false;
}

/**
 * Retrieve cached JSON data by key
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function getCache(key) {
  try {
    if (isRedisAvailable && redisClient && redisClient.status === "ready") {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (err) {
    // Redis failed, fall back to in-memory cache
  }

  // Check in-memory store
  const item = memoryCache.get(key);
  if (item) {
    if (item.expiresAt > Date.now()) {
      return item.value;
    }
    memoryCache.delete(key);
  }

  return null;
}

/**
 * Store data in cache with TTL in seconds
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds
 */
export async function setCache(key, value, ttlSeconds = 60) {
  // Always store in memory cache for instant local access
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  try {
    if (isRedisAvailable && redisClient && redisClient.status === "ready") {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
    }
  } catch (err) {
    // Ignore Redis write error; in-memory cache succeeded
  }
}

/**
 * Delete all cache entries matching a prefix (e.g. "leaderboard:" or "interviews:")
 * @param {string} prefix
 */
export async function clearCacheByPrefix(prefix) {
  // Clear memory cache
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }

  try {
    if (isRedisAvailable && redisClient && redisClient.status === "ready") {
      const keys = await redisClient.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
  } catch (err) {
    // Ignore Redis deletion failure
  }
}

/**
 * Close Redis connection cleanly (useful for test teardown)
 */
export async function closeCache() {
  if (redisClient) {
    try {
      redisClient.disconnect();
    } catch (err) {
      // Ignore
    }
  }
}

export default {
  getCache,
  setCache,
  clearCacheByPrefix,
  closeCache,
};

