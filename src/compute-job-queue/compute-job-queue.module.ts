import { Module, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { QueueService } from "./queue.service";
import { ComputeJobProcessor } from "./compute-job.processor";
import { QueueHealthIndicator } from "./compute-job-healt.indicators";
import { CacheModule } from "../cache/cache.module";
import { RetryPolicyService } from "./retry-policy.service";
import { DagModule } from "./dag/dag.module";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get("REDIS_HOST", "localhost"),
          port: configService.get("REDIS_PORT", 6379),
          password: configService.get("REDIS_PASSWORD"),
          db: configService.get("REDIS_DB", 0),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 100, // Keep last 100 completed jobs
          },
          removeOnFail: false, // Keep failed jobs for analysis
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: "compute-jobs",
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        },
      },
      {
        name: "dead-letter-queue",
        defaultJobOptions: {
          attempts: 1, // Dead letter queue doesn't retry
          removeOnComplete: false,
          removeOnFail: false,
        },
      },
    ),
    CacheModule,
    EventEmitterModule.forRoot(),
    forwardRef(() => DagModule),
  ],
  providers: [
    QueueService,
    ComputeJobProcessor,
    QueueHealthIndicator,
    RetryPolicyService,
  ],
  exports: [QueueService, BullModule, CacheModule, DagModule],
})
export class QueueModule {}
