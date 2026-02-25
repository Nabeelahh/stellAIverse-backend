# Job Provenance & Lineage Tracking Implementation

## Overview

This implementation provides comprehensive job provenance and lineage tracking for the StellaIverse compute job queue system. It enables reproducibility, auditing, and dependency-aware cache invalidation.

## Features Implemented

### ✅ Core Provenance Tracking
- **Job Definition Hashing**: Each job gets a deterministic hash based on its type and normalized payload
- **Input Tracking**: Complete input data and input hash for reproducibility
- **Provider Information**: Tracks which provider and model executed the job
- **Dependency Tracking**: Records parent job IDs and maintains child relationships
- **Execution Metadata**: Timestamps, execution duration, and custom metadata

### ✅ Lineage Queries
- **Ancestor Chain**: Get all jobs this job depends on (recursively)
- **Descendant Chain**: Get all jobs that depend on this job (recursively)
- **Lineage Depth**: Calculate the depth of dependency trees
- **Circular Dependency Prevention**: Prevents infinite loops in lineage traversal

### ✅ Reproducibility
- **Dependency Validation**: Check if all required dependencies are available
- **Job Rerun**: Recreate jobs with identical or modified inputs
- **Hash Verification**: Ensure input consistency across reruns

### ✅ Cache Invalidation
- **Dependent Job Discovery**: Find all jobs affected by upstream changes
- **Event-Driven Invalidation**: Automatic cache invalidation on job completion/failure
- **Differential Invalidation**: Only invalidate affected downstream jobs

### ✅ API Endpoints
- `GET /jobs/:id/provenance` - Get job provenance information
- `GET /jobs/:id/lineage` - Get job lineage (ancestors and descendants)
- `GET /jobs/:id/dependents` - Get jobs that depend on this job
- `GET /jobs/:id/export` - Export provenance graph as JSON
- `GET /jobs/:id/reproducible` - Check if job can be reproduced
- `POST /jobs/:id/rerun` - Rerun a job with identical or modified inputs
- `POST /jobs/:id/invalidate-cache` - Invalidate cache for job and dependents

## Architecture

### Components

1. **JobProvenanceService** - Core service for provenance tracking
2. **JobProvenance Entity** - Data model for provenance records
3. **ProvenanceController** - REST API endpoints
4. **ProvenanceCacheInvalidationListener** - Event-driven cache invalidation
5. **Job Processor Integration** - Automatic provenance creation during job execution

### Data Flow

```
Job Submission → Provenance Creation → Job Execution → Provenance Completion → Cache Invalidation Events
```

### Storage

Currently uses in-memory storage for demonstration. In production, this should be replaced with:
- **Database**: PostgreSQL/MongoDB for persistent provenance records
- **Graph Database**: Neo4j for complex lineage queries
- **Cache**: Redis for fast dependency lookups

## Usage Examples

### Basic Job with Dependencies

```typescript
// Create parent job
const parentJob = await queueService.addComputeJob({
  type: 'data-processing',
  payload: { data: 'source' },
  providerId: 'processor-v1',
  providerModel: 'batch-2024',
});

// Create dependent job
const childJob = await queueService.addComputeJob({
  type: 'ai-computation',
  payload: { query: 'analyze data' },
  providerId: 'ai-v2',
  parentJobIds: [String(parentJob.id)], // Dependency
});
```

### Query Job Lineage

```typescript
const lineage = await provenanceService.getJobLineage(jobId);
console.log(`Ancestors: ${lineage.ancestors.length}`);
console.log(`Descendants: ${lineage.descendants.length}`);
```

### Check Reproducibility

```typescript
const canReproduce = await provenanceService.canReproduce(jobId);
if (canReproduce) {
  // Safe to rerun
  const rerunJob = await queueService.addComputeJob({
    // ... same configuration
  });
}
```

### Export Provenance Graph

```typescript
const graph = await provenanceService.exportProvenanceGraph(jobId);
// graph.nodes - all jobs in the lineage
// graph.edges - dependency relationships
```

## Integration Points

### Job Processor
- Automatically creates provenance records when jobs start
- Marks provenance as completed when jobs finish
- Handles both successful and cached results

### Cache System
- Listens for job completion events
- Automatically invalidates dependent job caches
- Supports differential invalidation strategies

### Event System
- Emits provenance lifecycle events
- Enables audit logging and monitoring
- Supports custom event handlers

## Testing

### Unit Tests
- ✅ Provenance creation and completion
- ✅ Lineage traversal (ancestors/descendants)
- ✅ Dependency validation
- ✅ Reproducibility checks
- ✅ Graph export functionality

### Integration Tests
- ✅ End-to-end job processing with provenance
- ✅ API endpoint functionality
- ✅ Cache invalidation workflows
- ✅ Multi-level dependency chains

## Performance Considerations

### Current Implementation
- In-memory storage for fast access
- O(n) lineage traversal with cycle detection
- Efficient hash-based job lookups

### Production Optimizations
- **Database Indexing**: Index on job IDs, parent IDs, and hashes
- **Caching**: Cache frequently accessed lineage data
- **Batch Operations**: Bulk provenance creation for large workflows
- **Async Processing**: Background provenance updates

## Security & Privacy

### Data Protection
- Input data normalization removes sensitive timestamps
- Configurable metadata filtering
- Audit trail for provenance access

### Access Control
- Job-level permissions for provenance access
- User-scoped lineage queries
- Secure hash generation

## Monitoring & Observability

### Metrics
- Provenance creation/completion rates
- Lineage query performance
- Cache invalidation effectiveness
- Reproducibility success rates

### Events
- `job.provenance.created` - New provenance record
- `job.provenance.completed` - Job execution finished
- `compute.job.completed` - Triggers cache invalidation
- `compute.job.failed` - Handles failure scenarios

## Future Enhancements

### Planned Features
- **Workflow Visualization**: Web UI for provenance graphs
- **Advanced Queries**: Complex lineage filtering and search
- **Provenance Compression**: Optimize storage for large workflows
- **Cross-System Tracking**: Track jobs across multiple services

### Integration Opportunities
- **ML Pipeline Integration**: Track model training lineage
- **Data Pipeline Integration**: Track data transformation chains
- **Audit System Integration**: Compliance and governance features

## Configuration

### Environment Variables
```bash
# Provenance storage (future)
PROVENANCE_STORAGE_TYPE=memory|postgres|mongodb
PROVENANCE_CACHE_TTL=3600

# Performance tuning
PROVENANCE_MAX_LINEAGE_DEPTH=100
PROVENANCE_BATCH_SIZE=1000
```

### Module Configuration
```typescript
@Module({
  imports: [QueueModule],
  providers: [
    JobProvenanceService,
    ProvenanceCacheInvalidationListener,
  ],
  controllers: [ProvenanceController],
})
export class ProvenanceModule {}
```

## Conclusion

This implementation provides a solid foundation for job provenance and lineage tracking. It enables reproducible workflows, efficient cache invalidation, and comprehensive audit trails while maintaining good performance and extensibility.

The system is designed to scale from simple job dependencies to complex multi-stage workflows, making it suitable for scientific computing, ML pipelines, and data processing applications.