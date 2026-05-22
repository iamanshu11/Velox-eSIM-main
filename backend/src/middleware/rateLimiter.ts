import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import Redis from 'ioredis'

let redis: Redis | null = null;
let redisConnected = false;
let redisErrorLogged = false;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    connectTimeout: 2000,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null, // disable retries — fail fast, use memory store
    enableReadyCheck: false,
    enableOfflineQueue: false,
  });

  redis.on('connect', () => {
    redisConnected = true;
    redisErrorLogged = false;
    console.info('[RATE LIMITER] Redis connected — using Redis store');
  });

  redis.on('error', () => {
    redisConnected = false;
    if (!redisErrorLogged) {
      console.warn('[RATE LIMITER] Redis unavailable, using in-memory rate limiting (install Redis to enable distributed limiting)');
      redisErrorLogged = true;
    }
  });

  redis.on('close', () => {
    redisConnected = false;
  });
} catch (err) {
  console.warn('[RATE LIMITER] Failed to initialize Redis, using memory store');
  redis = null;
}

const createRateLimiter = (options: any) => {
  if (redis && redisConnected) {
    return rateLimit({
      ...options,
      store: new RedisStore({
        sendCommand: async (command: string, ...args: any[]) => {
          return await (redis as any)[command](...args);
        },
        prefix: options.prefix || 'rate-limit:',
      } as any),
    });
  }
  
  return rateLimit(options);
};

export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again later.',
})

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
})

export const paymentLimiter = createRateLimiter({
  windowMs: 60 * 1000, 
  max: 10, 
  message: 'Too many payment attempts, please try again later.',
})

export const createAccountLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, 
  max: 5, 
  message: 'Too many accounts created from this IP, please try again later.',
})
