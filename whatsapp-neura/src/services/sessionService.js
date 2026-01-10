import { redis } from "../config/redis.js";

export async function getSession(userId) {
  const data = await redis.get(userId);
  return data ? JSON.parse(data) : {};
}

export async function saveSession(userId, session) {
  await redis.set(userId, JSON.stringify(session), {
    EX: 60 * 30, // 30 minutes
  });
}
