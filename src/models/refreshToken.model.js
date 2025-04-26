const { Schema, model } = require("mongoose");
const refreshTokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    jti: {
      // JWT ID, used to identify corresponding access token
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const RefreshToken = model("RefreshToken", refreshTokenSchema);
module.exports = RefreshToken;
