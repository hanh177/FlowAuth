const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const { generateTokenPair } = require("./token.service");
const RefreshToken = require("../models/refreshToken.model");

module.exports = {
  async register({ username, email, password }) {
    const user = new User({ username, email, password });
    await user.save();

    const { accessToken, refreshToken } = await generateTokenPair({
      id: user._id,
    });

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  },
  async login({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    const isMatch = bcrypt.compare(user.password, password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }
    const { accessToken, refreshToken } = await generateTokenPair({
      id: user._id,
    });

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  },

  async logout({ id, jti }) {
    // Find the refresh token by userId and jti
    await RefreshToken.findOneAndUpdate(
      { userId: id, jti },
      { isRevoked: true }
    );
    return true;
  },

  /*
  1. Check if the refresh token dosn not exist in the database => return error 
  2. Check if the refresh token is expired => revoke it and return error
  3. Check if the refresh token is revoked => may be hacker, revoke all current refresh tokens 
  4. Or elase, revoke the current refresh token and generate a new one 
  */
  async refreshToken({ id, jti }) {
    // 1.
    const currentRefreshToken = await RefreshToken.findOne({ userId: id, jti });
    if (!currentRefreshToken) {
      throw new Error("Refresh token not found");
    }

    // 2.
    if (currentRefreshToken.expiresAt < new Date()) {
      await RefreshToken.updateOne(
        { _id: currentRefreshToken._id },
        { isRevoked: true }
      );
      throw new Error("Refresh token expired");
    }

    // 3.
    if (currentRefreshToken.isRevoked) {
      throw new Error("Refresh token revoked");
    }

    //4.
    const { accessToken, refreshToken } = await generateTokenPair({
      id,
    });

    await RefreshToken.updateOne(
      { _id: currentRefreshToken._id },
      { isRevoked: true }
    );

    return {
      accessToken,
      refreshToken,
    };
  },
};
