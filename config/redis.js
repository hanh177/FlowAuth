const { createClient } = require("redis");
const { REDIS_URL } = process.env;
const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.on("connect", () => console.log("Connected to Redis"));

async function connectRedis() {
  await redisClient.connect();
}

module.exports = { redisClient, connectRedis };
