const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const uuid = require("uuid").v4;
const RefreshToken = require("../models/refreshToken.model");

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

module.exports = {
  generateTokenPair,
  decodeToken,
};
