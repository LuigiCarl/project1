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

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
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
  if (!/^[a-z0-9_]{3,32}$/.test(normalizedUsername)) {
    return sendJson(res, 400, {
      error: "Username must be 3-32 characters using letters, numbers, or underscores.",
    });
  }
  if (password.length < 8 || password.length > 128) {
    return sendJson(res, 400, { error: "Password must be between 8 and 128 characters." });
  }

  try {
    const passwordHash = await hashPassword(password);
    const created = await redis.set(
      userKey(normalizedUsername),
      JSON.stringify({ username: normalizedUsername, passwordHash }),
      { nx: true },
    );

    if (created !== "OK") {
      return sendJson(res, 409, { error: "That username is already taken." });
    }

    return sendJson(res, 201, { message: "Account created successfully." });
  } catch (error) {
    console.error("Registration failed:", error);
    return sendJson(res, 500, { error: "Unable to create the account right now." });
  }
};
