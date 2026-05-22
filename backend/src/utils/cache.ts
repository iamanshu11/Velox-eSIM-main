import { config } from '@/config/env'
import Redis from 'ioredis'
import logger from './logger'

const REDIS_URL = config.redis_url || 'redis://localhost:6379'

class CacheService {
  private redis: Redis | null = null
  private isConnected: boolean = false

  constructor() {
    try {
      this.redis = new Redis(REDIS_URL, {
        retryStrategy: (times) => {
          if (times === 1) {
            logger.warn('Redis connection failed. Caching is disabled. Set REDIS_URL env var to enable.')
          }
          return null
        },
        connectTimeout: 5000,
        maxRetriesPerRequest: null,
      })

      this.redis.on('error', (err) => {
        if (this.isConnected) {
          logger.error('Redis error', err instanceof Error ? err : new Error(String(err)))
        }
      })

      this.redis.on('connect', () => {
        this.isConnected = true
        logger.success('Redis connected - caching enabled')
      })
    } catch (err) {
      logger.warn('Failed to initialize Redis. Caching is disabled.')
      this.redis = null
    }
  }

  private versionedKey(key: string): string {
    const cacheVersion = 'v1'
    return `${cacheVersion}:${key}`
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (!this.redis || !this.isConnected) return
    
    try {
      const versionedKey = this.versionedKey(key)
      const serialized = JSON.stringify(value)
      if (ttl) {
        await this.redis.setex(versionedKey, ttl, serialized)
      } else {
        await this.redis.set(versionedKey, serialized)
      }
    } catch (error) {
      logger.error(`Error setting cache key ${key}`, error instanceof Error ? error : new Error(String(error)))
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis || !this.isConnected) return null
    
    try {
      const versionedKey = this.versionedKey(key)
      const value = await this.redis.get(versionedKey)
      return value ? (JSON.parse(value) as T) : null
    } catch (error) {
      logger.error(`Error getting cache key ${key}`, error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis || !this.isConnected) return
    
    try {
      const versionedKey = this.versionedKey(key)
      await this.redis.del(versionedKey)
    } catch (error) {
      logger.error(`Error deleting cache key ${key}`, error instanceof Error ? error : new Error(String(error)))
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.redis || !this.isConnected) return
    
    try {
      const versionedPattern = this.versionedKey(pattern)
      const keys = await this.redis.keys(versionedPattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      logger.error(`Error deleting cache pattern ${pattern}`, error instanceof Error ? error : new Error(String(error)))
    }
  }

  async clear(): Promise<void> {
    if (!this.redis || !this.isConnected) return
    
    try {
      await this.redis.flushdb()
    } catch (error) {
      logger.error('Error clearing cache', error instanceof Error ? error : new Error(String(error)))
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) return false
    
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      logger.error(`Error checking cache key ${key}`, error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  async setHash(
    key: string,
    field: string,
    value: unknown,
    ttl?: number
  ): Promise<void> {
    if (!this.redis || !this.isConnected) return
    
    try {
      const serialized = JSON.stringify(value)
      await this.redis.hset(key, field, serialized)
      if (ttl) {
        await this.redis.expire(key, ttl)
      }
    } catch (error) {
      logger.error(`Error setting hash ${key}:${field}`, error instanceof Error ? error : new Error(String(error)))
    }
  }

  async getHash<T>(key: string, field: string): Promise<T | null> {
    if (!this.redis || !this.isConnected) return null
    
    try {
      const value = await this.redis.hget(key, field)
      return value ? (JSON.parse(value) as T) : null
    } catch (error) {
      logger.error(`Error getting hash ${key}:${field}`, error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  async getAllHash<T>(key: string): Promise<Record<string, T>> {
    if (!this.redis || !this.isConnected) return {}
    
    try {
      const data = await this.redis.hgetall(key)
      const result: Record<string, T> = {}
      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value as string) as T
      }
      return result
    } catch (error) {
      logger.error(`Error getting all hash ${key}`, error instanceof Error ? error : new Error(String(error)))
      return {}
    }
  }

  async incrementCounter(key: string, ttl?: number): Promise<number> {
    if (!this.redis || !this.isConnected) return 0
    
    try {
      const result = await this.redis.incr(key)
      if (ttl && result === 1) {
        await this.redis.expire(key, ttl)
      }
      return result
    } catch (error) {
      logger.error(`Error incrementing counter ${key}`, error instanceof Error ? error : new Error(String(error)))
      return 0
    }
  }

  async close(): Promise<void> {
    if (!this.redis) return
    
    try {
      await this.redis.quit()
    } catch (error) {
      logger.error('Error closing Redis connection', error instanceof Error ? error : new Error(String(error)))
    }
  }
}

export default new CacheService()

