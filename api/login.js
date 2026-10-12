const { Redis } = require("@upstash/redis");
const crypto = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(crypto.scrypt);
const redis = Redis.fromEnv();

function sendJson(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function userKey(username) {
  return `user:${encodeURIComponent(username)}`;
}

async function verifyPassword(password, storedPassword) {
  const [salt, expectedHex] = String(storedPassword).split(":");
  if (!salt || !expectedHex || !/^[a-f0-9]+$/i.test(expectedHex)) return false;

  const actual = await scrypt(password, salt, expectedHex.length / 2);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return sendJson(res, 400, { error: "Username and password are required." });
  }

  const normalizedUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(normalizedUsername) || password.length > 128) {
    return sendJson(res, 401, { error: "Invalid username or password." });
  }

  try {
    const stored = await redis.get(userKey(normalizedUsername));
    if (!stored) {
      return sendJson(res, 401, { error: "Invalid username or password." });
    }

    const user = typeof stored === "string" ? JSON.parse(stored) : stored;
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return sendJson(res, 401, { error: "Invalid username or password." });
    }

    return sendJson(res, 200, { message: "Login successful.", username: user.username });
  } catch (error) {
    console.error("Login failed:", error);
    return sendJson(res, 500, { error: "Unable to log in right now." });
  }
};
