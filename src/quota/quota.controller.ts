import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { RateLimiterService } from "./rate-limiter.service";
import { QUOTA_LEVELS, DEFAULT_QUOTA } from "../config/quota.config";
import { AuthGuard } from "@nestjs/passport";

@Controller("quota")
export class QuotaController {
  constructor(private readonly rateLimiterService: RateLimiterService) {}

  @Get("usage")
  @UseGuards(AuthGuard("jwt"))
  async getUsage(@Request() req: any) {
    const userId = req.user.id;
    // Assuming we want to check against 'standard' level for authenticated users by default
    // or we could fetch user's tier from their profile.
    const level = req.user.tier || "standard";
    const config = QUOTA_LEVELS[level] || DEFAULT_QUOTA;

    // We use a dummy call (requested=0) to check state without consuming
    const status = await this.rateLimiterService.checkQuota(
      `user:${userId}`,
      config.limit,
      config.windowMs,
      config.burst,
      0, // Don't use tokens
    );

    return {
      tier: level,
      config,
      remaining: status.remaining,
      resetMs: status.resetMs,
    };
  }
}
