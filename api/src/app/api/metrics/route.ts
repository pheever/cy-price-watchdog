import { NextResponse } from 'next/server';

// Track request counts (in-memory, resets on restart)
const requestCounts = {
  total: 0,
  byStatus: {} as Record<string, number>,
};

// Server start time
const startTime = Date.now();

// Increment request counter (call from middleware if needed)
export function incrementRequestCount(status: number) {
  requestCounts.total++;
  const statusKey = `${Math.floor(status / 100)}xx`;
  requestCounts.byStatus[statusKey] = (requestCounts.byStatus[statusKey] || 0) + 1;
}

export async function GET() {
  const memoryUsage = process.memoryUsage();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  // Return metrics in a format Telegraf can parse
  // Using flat structure for easier ingestion
  const metrics = {
    // Memory metrics (bytes)
    memory_heap_used: memoryUsage.heapUsed,
    memory_heap_total: memoryUsage.heapTotal,
    memory_rss: memoryUsage.rss,
    memory_external: memoryUsage.external,

    // Process metrics
    uptime_seconds: uptime,
    node_version: process.version,

    // Request counts
    requests_total: requestCounts.total,
    requests_2xx: requestCounts.byStatus['2xx'] || 0,
    requests_3xx: requestCounts.byStatus['3xx'] || 0,
    requests_4xx: requestCounts.byStatus['4xx'] || 0,
    requests_5xx: requestCounts.byStatus['5xx'] || 0,

    // Timestamp
    timestamp: Date.now(),
  };

  return NextResponse.json(metrics, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
