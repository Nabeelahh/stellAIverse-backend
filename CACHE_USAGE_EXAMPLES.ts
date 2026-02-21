/**
 * CACHE LAYER USAGE EXAMPLES
 * Comprehensive examples for using the caching layer in your application
 */

import { CacheService } from './src/cache/cache.service';
import { CacheWarmerService } from './src/cache/services/cache-warmer.service';
import { CacheJobPlugin } from './src/cache/plugins/cache-job.plugin';
import {
  CacheConfigDto,
  CompressionAlgorithm,
} from './src/cache/dto/cache-config.dto';
import { CreateJobDto } from './src/compute-job-queue/compute.job.dto';

// ============================================================================
// EXAMPLE 1: Basic Cache Usage
// ============================================================================

async function example1_basicCache() {
  console.log('Example 1: Basic Cache Usage\n');

  // Create a cache configuration
  const cacheConfig = new CacheConfigDto();
  cacheConfig.enabled = true;
  cacheConfig.ttlMs = 24 * 60 * 60 * 1000; // 24 hours

  // Submit a job with caching enabled
  const job = {
    type: 'data-processing',
    payload: {
      records: [
        { id: 1, name: 'Record 1' },
        { id: 2, name: 'Record 2' },
      ],
    },
    cacheConfig,
  };

  // First execution: Original computation
  // Second execution: Cached result
  console.log('Job submitted with cache enabled');
}

// ============================================================================
// EXAMPLE 2: Compression for Large Payloads
// ============================================================================

async function example2_compression() {
  console.log('Example 2: Compression for Large Payloads\n');

  const cacheConfig = new CacheConfigDto();
  cacheConfig.enabled = true;
  cacheConfig.compression = CompressionAlgorithm.GZIP;
  cacheConfig.compressionThresholdBytes = 1024; // 1KB threshold

  const job = {
    type: 'report-generation',
    payload: {
      data: Array(5000)
        .fill(null)
        .map((_, i) => ({
          id: i,
          value: Math.random(),
          timestamp: new Date(),
          metadata: { source: 'api', processed: true },
        })),
    },
    cacheConfig,
  };

  console.log(
    'Large payload job submitted with gzip compression enabled',
  );
  console.log(
    'Expected compression ratio: 60-75% for structured data',
  );
}

// ============================================================================
// EXAMPLE 3: Dependency-Aware Caching (DAG)
// ============================================================================

async function example3_dependencyAwareCache() {
  console.log('Example 3: Dependency-Aware Caching (DAG)\n');

  // Job 1: Extract data
  const extractConfig = new CacheConfigDto();
  extractConfig.enabled = true;
  extractConfig.ttlMs = 48 * 60 * 60 * 1000; // 48 hours

  const extractJob = {
    type: 'data-processing',
    payload: { source: 'database', query: 'SELECT * FROM users' },
    cacheConfig: extractConfig,
  };

  // Submit extract job
  const extractJobId = 'extract-job-001';

  // Job 2: Process data (depends on Job 1)
  const processConfig = new CacheConfigDto();
  processConfig.enabled = true;
  processConfig.dependencies = [extractJobId]; // Clear cache if Job 1 changes
  processConfig.ttlMs = 24 * 60 * 60 * 1000;

  const processJob = {
    type: 'ai-computation',
    payload: { algorithm: 'clustering', k: 5 },
    cacheConfig: processConfig,
  };

  // Job 3: Generate report (depends on Job 2)
  const reportConfig = new CacheConfigDto();
  reportConfig.enabled = true;
  reportConfig.dependencies = ['process-job-001']; // Clear if Job 2 changes
  reportConfig.ttlMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  const reportJob = {
    type: 'report-generation',
    payload: { format: 'pdf', includeCharts: true },
    cacheConfig: reportConfig,
  };

  console.log('DAG setup:');
  console.log('Extract (48h) → Process (24h) → Report (7d)');
  console.log('When Extract changes, Process & Report caches are cleared');
}

// ============================================================================
// EXAMPLE 4: Cache-Only Mode
// ============================================================================

async function example4_cacheOnlyMode() {
  console.log('Example 4: Cache-Only Mode\n');

  const cacheConfig = new CacheConfigDto();
  cacheConfig.enabled = true;
  cacheConfig.cacheOnly = true; // Return cached result without execution

  const job = {
    type: 'data-processing',
    payload: { records: [] },
    cacheConfig,
  };

  console.log('Cache-only mode:');
  console.log('- Returns cached result if available');
  console.log('- Throws error if no cache hit');
  console.log('- Never executes the job');
  console.log('Use case: Avoid redundant expensive computations');
}

// ============================================================================
// EXAMPLE 5: Skip Cache
// ============================================================================

async function example5_skipCache() {
  console.log('Example 5: Skip Cache\n');

  const cacheConfig = new CacheConfigDto();
  cacheConfig.enabled = true;
  cacheConfig.skipCache = true; // Always execute, but cache the result

  const job = {
    type: 'data-processing',
    payload: { forceRefresh: true },
    cacheConfig,
  };

  console.log('Skip cache mode:');
  console.log('- Always executes the job');
  console.log('- Stores result in cache');
  console.log('- Useful for real-time data, manual refreshes');
}

// ============================================================================
// EXAMPLE 6: Cache Warming
// ============================================================================

async function example6_cacheWarming(
  cacheWarmerService: CacheWarmerService,
) {
  console.log('Example 6: Cache Warming\n');

  const jobs = [
    {
      jobType: 'report-generation',
      payload: { month: 'January', year: 2024 },
      jobId: 'report-jan-2024',
      config: new CacheConfigDto(),
    },
    {
      jobType: 'report-generation',
      payload: { month: 'February', year: 2024 },
      jobId: 'report-feb-2024',
      config: new CacheConfigDto(),
    },
    {
      jobType: 'report-generation',
      payload: { month: 'March', year: 2024 },
      jobId: 'report-mar-2024',
      config: new CacheConfigDto(),
    },
  ];

  const result = await cacheWarmerService.warmCache({
    jobs,
    priority: 'normal',
  });

  console.log('Cache warming results:');
  console.log(`Total jobs: ${result.totalJobs}`);
  console.log(`Successful: ${result.successCount}`);
  console.log(`Failed: ${result.failureCount}`);
  console.log(`Duration: ${result.duration}ms`);
  console.log(`Cache keys: ${result.cacheKeys.length}`);
}

// ============================================================================
// EXAMPLE 7: Monitoring and Metrics
// ============================================================================

async function example7_monitoring(cacheService: CacheService) {
  console.log('Example 7: Monitoring and Metrics\n');

  // Check cache health
  const isHealthy = await cacheService.health();
  console.log(`Cache backend healthy: ${isHealthy}`);

  // Get comprehensive metrics
  const metrics = await cacheService.getMetrics();
  console.log('Cache metrics:');
  console.log(`- Cache hits: ${metrics.cacheHits}`);
  console.log(`- Cache misses: ${metrics.cacheMisses}`);
  console.log(`- Hit ratio: ${((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(2)}%`);
  console.log(`- Evictions: ${metrics.cacheEvictions}`);
  console.log(`- Total size: ${(metrics.totalCacheSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(
    `- Compression ratio: ${metrics.compressionRatio.toFixed(2)}%`,
  );
  console.log(`- Avg hit latency: ${metrics.avgHitLatency.toFixed(2)}ms`);
  console.log(`- Avg miss latency: ${metrics.avgMissLatency.toFixed(2)}ms`);
}

// ============================================================================
// EXAMPLE 8: Tag-Based Grouping
// ============================================================================

async function example8_tagGrouping(cacheService: CacheService) {
  console.log('Example 8: Tag-Based Grouping\n');

  const config = new CacheConfigDto();
  config.enabled = true;
  config.tags = ['production', 'critical', 'daily_report'];

  const job = {
    type: 'report-generation',
    payload: { reportType: 'daily_summary' },
    cacheConfig: config,
  };

  console.log('Tagged cache entry with: production, critical, daily_report');

  // Later, clear all production caches
  await cacheService.invalidateByTags(['production']);
  console.log('Cleared all production cache entries');
}

// ============================================================================
// EXAMPLE 9: Content-Addressable Caching
// ============================================================================

async function example9_contentAddressable(cacheService: CacheService) {
  console.log('Example 9: Content-Addressable Caching\n');

  // Same payload produces same cache entry
  const payload = {
    algorithm: 'clustering',
    k: 5,
    data: [1, 2, 3, 4, 5],
  };

  // First job
  const result1 = await cacheService.set(
    'ai-computation',
    payload,
    { clusters: [[1, 2], [3, 4], [5]] },
  );

  // Second job with identical payload
  const result2 = await cacheService.set(
    'ai-computation',
    payload,
    { clusters: [[1, 2], [3, 4], [5]] },
  );

  console.log('Content-addressable caching:');
  console.log(`Cache key 1: ${result1.cacheKey}`);
  console.log(`Cache key 2: ${result2.cacheKey}`);
  console.log(`Same key: ${result1.cacheKey === result2.cacheKey}`);
  console.log('Benefits:');
  console.log('- Automatic deduplication');
  console.log('- Consistent cache hits');
  console.log('- Easy sharing between services');
}

// ============================================================================
// EXAMPLE 10: Complex Workflow
// ============================================================================

async function example10_complexWorkflow(
  cacheService: CacheService,
  cacheWarmerService: CacheWarmerService,
) {
  console.log('Example 10: Complex Workflow\n');

  // Setup: Daily report generation with multiple dependencies
  console.log('Scenario: Generate comprehensive daily reports\n');

  // Step 1: Warm cache with yesterday's data (fast path)
  console.log('Step 1: Cache warming...');
  const yesterdayData = {
    jobs: [
      {
        jobType: 'data-extraction',
        payload: {
          source: 'analytics_db',
          date: new Date(Date.now() - 86400000),
        },
        config: {
          ttlMs: 30 * 24 * 60 * 60 * 1000, // 30 days
        },
      },
    ],
  };

  await cacheWarmerService.warmCache(yesterdayData);
  console.log('Yesterday\'s data cached\n');

  // Step 2: Extract today's data with no cache
  console.log('Step 2: Extract today\'s data...');
  const extractConfig = new CacheConfigDto();
  extractConfig.skipCache = true; // Fresh data always
  extractConfig.ttlMs = 86400000; // Cache for 24 hours

  // Step 3: Process with dependency on extraction
  console.log('Step 3: Process with dependencies...');
  const processConfig = new CacheConfigDto();
  processConfig.dependencies = ['extraction-job'];
  processConfig.compression = CompressionAlgorithm.GZIP;

  // Step 4: Generate reports
  console.log('Step 4: Generate reports...');
  const reportConfig = new CacheConfigDto();
  reportConfig.tags = ['production', 'daily'];
  reportConfig.ttlMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Step 5: Invalidate old reports
  console.log('Step 5: Cleanup...');
  await cacheService.invalidateByTags(['old_daily_reports']);

  // Step 6: Monitor
  console.log('Step 6: Monitor...');
  const metrics = await cacheService.getMetrics();
  console.log(`\nFinal metrics:`);
  console.log(
    `- Hit ratio: ${((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(1)}%`,
  );
  console.log(`- Cache size: ${(metrics.totalCacheSize / 1024).toFixed(1)}KB`);
}

// ============================================================================
// EXPORT EXAMPLES
// ============================================================================

export {
  example1_basicCache,
  example2_compression,
  example3_dependencyAwareCache,
  example4_cacheOnlyMode,
  example5_skipCache,
  example6_cacheWarming,
  example7_monitoring,
  example8_tagGrouping,
  example9_contentAddressable,
  example10_complexWorkflow,
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║              CACHE LAYER USAGE EXAMPLES                        ║
║              See above for 10 comprehensive examples           ║
╚════════════════════════════════════════════════════════════════╝

These examples demonstrate:
1. Basic cache usage
2. Compression for large payloads
3. Dependency-aware caching (DAG)
4. Cache-only mode
5. Skip cache for forced refresh
6. Cache warming for batch pre-population
7. Monitoring and metrics
8. Tag-based grouping
9. Content-addressable caching
10. Complex real-world workflow

For more details, see CACHE_IMPLEMENTATION.md
`);
