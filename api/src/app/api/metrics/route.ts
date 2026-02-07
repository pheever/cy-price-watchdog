import { NextResponse } from 'next/server';

const startTime = Date.now();

export async function GET() {
  const memoryUsage = process.memoryUsage();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const metrics = {
    memory_heap_used: memoryUsage.heapUsed,
    memory_heap_total: memoryUsage.heapTotal,
    memory_rss: memoryUsage.rss,
    memory_external: memoryUsage.external,
    uptime_seconds: uptime,
    node_version: process.version,
    timestamp: Date.now(),
  };

  return NextResponse.json(metrics, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
