import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export interface QuotaResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

@Injectable()
export class RateLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly redis: Redis;
  private readonly luaScript = `
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local window_ms = tonumber(ARGV[2])
    local burst = tonumber(ARGV[3])
    local now = tonumber(ARGV[4])
    local requested = tonumber(ARGV[5] or 1)

    local state = redis.call('HMGET', key, 'tokens', 'last_refill')
    local tokens = tonumber(state[1])
    local last_refill = tonumber(state[2])

    if not tokens then
        tokens = burst
        last_refill = now
    else
        local elapsed = math.max(0, now - last_refill)
        local refill = elapsed * (limit / window_ms)
        tokens = math.min(burst, tokens + refill)
        last_refill = now
    end

    local allowed = 0
    if tokens >= requested then
        tokens = tokens - requested
        allowed = 1
    end

    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
    redis.call('PEXPIRE', key, math.ceil(window_ms * 1.5))

    return {allowed, math.floor(tokens)}
  `;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>(
      "REDIS_URL",
      "redis://localhost:6379",
    );
    this.redis = new Redis(redisUrl);

    this.redis.on("error", (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });
  }

  async checkQuota(
    key: string,
    limit: number,
    windowMs: number,
    burst: number,
    requested = 1,
  ): Promise<QuotaResult> {
    try {
      const now = Date.now();
      const result = (await this.redis.eval(
        this.luaScript,
        1,
        `quota:${key}`,
        limit,
        windowMs,
        burst,
        now,
        requested,
      )) as [number, number];

      const [allowed, remaining] = result;

      return {
        allowed: allowed === 1,
        remaining,
        resetMs: windowMs, // Simplified reset time for headers
      };
    } catch (error) {
      this.logger.error(
        `Failed to check quota for key ${key}: ${error.message}`,
      );
      // Fail open or closed? For rate limiting, usually fail open or half-open.
      // But for security/guarantees, fail closed. Let's fail open to prevent DoS by Redis failure.
      return { allowed: true, remaining: 0, resetMs: 0 };
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
