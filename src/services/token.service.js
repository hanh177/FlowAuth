const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const uuid = require("uuid").v4;
const RefreshToken = require("../models/refreshToken.model");
const { redisClient } = require("../../config/redis");
const crypto = require("crypto");

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
const generateTokenPair = async (payload) => {
  const jti = uuid();
  const refreshToken = uuid();
  const hashedToken = hashToken(refreshToken);
  const accessToken = jwt.sign({ ...payload, jti }, JWT_SECRET, {
    expiresIn: "10m",
  });

  await RefreshToken.create({
    token: hashedToken,
    userId: payload.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    jti, // to identify access token
  });

  return { accessToken, refreshToken };
};

const decodeToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const revokeRefreshToken = async (query) => {
  const tokens = await RefreshToken.find(query);

  if (tokens.length === 0) return true;

  const pipeline = redisClient.multi();
  for (const token of tokens) {
    pipeline.set(`revoked_jti:${token.jti}`, "true", "EX", 30 * 24 * 60 * 60);
  }
  await pipeline.exec();

  const ids = tokens.map((token) => token._id);
  await RefreshToken.updateMany({ _id: { $in: ids } }, { isRevoked: true });

  return true;
};

module.exports = {
  generateTokenPair,
  decodeToken,
  revokeRefreshToken,
};
