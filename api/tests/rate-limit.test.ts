import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';

beforeEach(() => {
  vi.useFakeTimers();
});

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const key = 'test:allow';
    const result = checkRateLimit(key, { windowMs: 60000, maxRequests: 5 });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks requests at the limit', () => {
    const key = 'test:block';
    const config = { windowMs: 60000, maxRequests: 3 };

    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const result = checkRateLimit(key, config);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('decrements remaining on each call', () => {
    const key = 'test:remaining';
    const config = { windowMs: 60000, maxRequests: 5 };

    expect(checkRateLimit(key, config).remaining).toBe(4);
    expect(checkRateLimit(key, config).remaining).toBe(3);
    expect(checkRateLimit(key, config).remaining).toBe(2);
  });

  it('resets after window expires', () => {
    const key = 'test:reset';
    const config = { windowMs: 1000, maxRequests: 2 };

    checkRateLimit(key, config);
    checkRateLimit(key, config);
    // Should be blocked now
    expect(checkRateLimit(key, config).allowed).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(1001);

    // Should be allowed again
    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('tracks different keys independently', () => {
    const config = { windowMs: 60000, maxRequests: 1 };

    checkRateLimit('key-a', config);
    // key-a is now exhausted
    expect(checkRateLimit('key-a', config).allowed).toBe(false);
    // key-b should still be allowed
    expect(checkRateLimit('key-b', config).allowed).toBe(true);
  });

  it('uses default config when none provided', () => {
    const key = 'test:defaults';
    const result = checkRateLimit(key);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99); // maxRequests=100 default, minus 1
  });

  it('returns resetAt in the future', () => {
    const key = 'test:resetAt';
    const now = Date.now();
    const result = checkRateLimit(key, { windowMs: 5000, maxRequests: 10 });

    expect(result.resetAt).toBeGreaterThan(now - 1);
    expect(result.resetAt).toBeLessThanOrEqual(now + 5000);
  });
});

describe('getClientId', () => {
  it('returns first IP from x-forwarded-for', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientId(request)).toBe('1.2.3.4');
  });

  it('returns single IP from x-forwarded-for', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.1' },
    });
    expect(getClientId(request)).toBe('10.0.0.1');
  });

  it('falls back to x-real-ip', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '192.168.1.1' },
    });
    expect(getClientId(request)).toBe('192.168.1.1');
  });

  it('prefers x-forwarded-for over x-real-ip', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
      },
    });
    expect(getClientId(request)).toBe('1.1.1.1');
  });

  it('returns "unknown" when no headers present', () => {
    const request = new Request('http://localhost');
    expect(getClientId(request)).toBe('unknown');
  });
});
