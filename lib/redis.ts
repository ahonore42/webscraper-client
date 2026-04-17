import Redis from "ioredis"

let redisRegular: Redis | null = null
let redisSubscriber: Redis | null = null

function createRedis(): Redis {
  const url = process.env.REDIS_URL
  if (!url) {
    throw new Error("REDIS_URL environment variable is not set")
  }
  return new Redis(url)
}

/** Regular connection — use for SET, GET, PUBLISH, etc. */
export function getRedis(): Redis {
  if (!redisRegular) {
    redisRegular = createRedis()
  }
  return redisRegular
}

/** Subscriber connection — dedicated to SUBSCRIBE. Never use for non-sub commands. */
export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    redisSubscriber = createRedis()
  }
  return redisSubscriber
}
