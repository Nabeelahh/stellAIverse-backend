import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RateLimiterService } from "./rate-limiter.service";
import { QuotaController } from "./quota.controller";

@Module({
  imports: [ConfigModule],
  providers: [RateLimiterService],
  controllers: [QuotaController],
  exports: [RateLimiterService],
})
export class QuotaModule {}
