import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RateLimiterService } from "../../quota/rate-limiter.service";
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from "../decorators/rate-limit.decorator";
import { QUOTA_LEVELS, DEFAULT_QUOTA } from "../../config/quota.config";

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimiterService: RateLimiterService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const trackerKey = this.getTrackerKey(request);

    // Merge options with level config
    const levelConfig = QUOTA_LEVELS[options.level || "free"] || DEFAULT_QUOTA;
    const limit = options.limit ?? levelConfig.limit;
    const windowMs = options.windowMs ?? levelConfig.windowMs;
    const burst = options.burst ?? levelConfig.burst;

    const result = await this.rateLimiterService.checkQuota(
      trackerKey,
      limit,
      windowMs,
      burst,
    );

    const response = context.switchToHttp().getResponse();

    // Set headers
    response.header("X-RateLimit-Limit", limit);
    response.header("X-RateLimit-Remaining", result.remaining);
    response.header(
      "X-RateLimit-Reset",
      new Date(Date.now() + result.resetMs).toISOString(),
    );

    if (!result.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: "Rate limit exceeded",
          retryAfterMs: result.resetMs,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getTrackerKey(req: any): string {
    const userId = req.user?.id;
    if (userId) {
      return `user:${userId}`;
    }

    const xff = req.headers?.["x-forwarded-for"];
    const ip = typeof xff === "string" ? xff.split(",")[0].trim() : req.ip;

    return `ip:${ip || "unknown"}`;
  }
}
