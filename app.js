require("dotenv").config();
const express = require("express");
const userService = require("./src/services/user.service");
const { decodeToken } = require("./src/services/token.service");
const { connectRedis, redisClient } = require("./config/redis");
const RefreshToken = require("./src/models/refreshToken.model");

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

require("./config/database")();
connectRedis();

// middleware to check and validate JWT token
app.use("/", async (req, res, next) => {
  if (
    req.headers["authorization"] &&
    req.headers["authorization"].startsWith("Bearer")
  ) {
    const token = req.headers["authorization"].split(" ")[1];
    const decoded = decodeToken(token);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // in case the refresh token is revoked but the access token is still valid
    const isTokenRevoked = await redisClient.get(`revoked_jti:${decoded.jti}`);
    if (isTokenRevoked) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.decoded = decoded;
  }
  next();
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userService.login({ email, password });
    res.status(200).json(user);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

app.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await userService.register({ username, email, password });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("auth/logout", async (req, res) => {
  if (!req.decoded) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  await userService.logout(req.decoded);
  res.send("Logout successful");
});

app.get("/auth/refresh", async (req, res) => {
  try {
    const refresh = await userService.refreshToken(req.decoded);
    res.status(201).json(refresh);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// get all refresh tokens for a user => just for testing
app.get("/auth/refresh-tokens", async (req, res) => {
  try {
    if (!req.decoded) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const tokens = await RefreshToken.find({ userId: req.decoded.id });
    res.status(200).json(tokens);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// get all invoked jti => just for testing
app.get("/auth/invoked-jti", async (req, res) => {
  try {
    const data = await redisClient.keys("revoked_jti:*");
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
