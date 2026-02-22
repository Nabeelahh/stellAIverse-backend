import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RetryBackoffPolicy {
  type: 'fixed' | 'exponential';
  delay: number;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoff: RetryBackoffPolicy;
}

type RetryPolicyMap = Record<string, Partial<RetryPolicy>>;

@Injectable()
export class RetryPolicyService {
  private readonly logger = new Logger(RetryPolicyService.name);

  private readonly defaultPolicy: RetryPolicy = {
    maxAttempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  };

  private readonly defaultTypePolicies: Record<string, RetryPolicy> = {
    'email-notification': {
      maxAttempts: 2,
      backoff: { type: 'fixed', delay: 1000 },
    },
    'batch-operation': {
      maxAttempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
    },
  };

  private readonly configuredPolicies: Record<string, RetryPolicy>;

  constructor(private readonly configService: ConfigService) {
    this.configuredPolicies = this.loadConfiguredPolicies();
  }

  getPolicy(jobType: string): RetryPolicy {
    return (
      this.configuredPolicies[jobType] ||
      this.defaultTypePolicies[jobType] ||
      this.defaultPolicy
    );
  }

  private loadConfiguredPolicies(): Record<string, RetryPolicy> {
    const raw = this.configService.get<string>('COMPUTE_JOB_RETRY_POLICIES');
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw) as RetryPolicyMap;
      const result: Record<string, RetryPolicy> = {};

      for (const [jobType, policy] of Object.entries(parsed)) {
        const merged = this.normalizePolicy(policy);
        if (merged) {
          result[jobType] = merged;
        }
      }

      return result;
    } catch (error) {
      this.logger.warn(
        `Invalid COMPUTE_JOB_RETRY_POLICIES JSON. Falling back to defaults: ${error.message}`,
      );
      return {};
    }
  }

  private normalizePolicy(policy: Partial<RetryPolicy>): RetryPolicy | null {
    const maxAttempts = Number(policy?.maxAttempts);
    const backoffType = policy?.backoff?.type;
    const backoffDelay = Number(policy?.backoff?.delay);

    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      return null;
    }

    if (
      (backoffType !== 'fixed' && backoffType !== 'exponential') ||
      !Number.isFinite(backoffDelay) ||
      backoffDelay < 0
    ) {
      return null;
    }

    return {
      maxAttempts,
      backoff: {
        type: backoffType,
        delay: backoffDelay,
      },
    };
  }
}
