import IORedis from "ioredis";

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
};

export const redisConnection = new IORedis.default(redisConfig);

redisConnection.on("error", (err) => {
  console.error("[Redis] Critical Connection Error:", err);
});
