import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { AppService } from "./app.service";
import { JwtAuthGuard } from "./auth/jwt.guard";
import { RateLimit } from "./common/decorators/rate-limit.decorator";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  @RateLimit({ level: "free", limit: 2, windowMs: 60000 }) // Max 2 requests per minute for health
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }

  @Get("info")
  @RateLimit({ level: "standard" }) // Default standard level
  getInfo(): {
    name: string;
    version: string;
    description: string;
    modules: string[];
  } {
    return this.appService.getInfo();
  }

  @UseGuards(JwtAuthGuard)
  @Get("protected")
  getProtected(@Request() req: any): {
    message: string;
    userAddress: string;
  } {
    return {
      message: "This is a protected endpoint",
      userAddress: req.user.address,
    };
  }
}
