const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const uuid = require("uuid").v4;
const RefreshToken = require("../models/refreshToken.model");
const { redisClient } = require("../../config/redis");

const generateTokenPair = async (payload) => {
  const jti = uuid();
  const accessToken = jwt.sign({ ...payload, jti }, JWT_SECRET, {
    expiresIn: "10m",
  });

  const refreshToken = await RefreshToken.create({
    token: uuid(),
    userId: payload.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    jti, // to identify access token
  });

  return { accessToken, refreshToken: refreshToken.token };
};

const decodeToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const revokeRefreshToken = async ({ id, jti }) => {
  await RefreshToken.findOneAndUpdate({ userId: id, jti }, { isRevoked: true });

  // Store the revoked token jti in Redis with a TTL of 30 days
  await redisClient.set(`revoked_jti:${jti}`, "true", "EX 30 days");
  return true;
};

module.exports = {
  generateTokenPair,
  decodeToken,
  revokeRefreshToken,
};
