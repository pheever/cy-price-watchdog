# Metrics SDK

Client libraries for sending metrics and events to TimescaleDB.

## Planned Components

### Server SDK (TypeScript)

```typescript
// Record a metric
recordMetric(name: string, value: number, tags?: Record<string, string>): void

// Record an event
recordEvent(event: string, properties?: Record<string, unknown>): void

// Flush buffered metrics
flush(): Promise<void>
```

### Client SDK (Browser)

```typescript
// Track user interaction
track(event: string, properties?: Record<string, unknown>): void

// Track page view (automatic)
trackPageView(): void

// Identify session
setSessionId(id: string): void
```

## Features (Planned)

- [ ] Batching - Buffer metrics and send in batches
- [ ] Retry - Automatic retry on failure
- [ ] Offline support - Queue events when offline
- [ ] Sampling - Sample high-volume events
- [ ] Privacy - Configurable PII filtering
