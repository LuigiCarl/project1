const { Redis } = require("@upstash/redis");

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  throw new Error(
    "Missing Redis credentials. Set UPSTASH_REDIS_REST_URL and " +
    "UPSTASH_REDIS_REST_TOKEN, or KV_REST_API_URL and KV_REST_API_TOKEN.",
  );
}

module.exports = new Redis({ url, token });
