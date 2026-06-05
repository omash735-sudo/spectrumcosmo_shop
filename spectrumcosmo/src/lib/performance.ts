// lib/performance.ts
class PerformanceMonitor {
  private metrics: Array<{ endpoint: string; durationMs: number; timestamp: number }> = [];
  private readonly maxMetrics = 100;

  record(endpoint: string, durationMs: number) {
    this.metrics.push({ endpoint, durationMs, timestamp: Date.now() });
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getAverageLatency(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.durationMs, 0);
    return sum / this.metrics.length;
  }

  getMetrics() {
    return {
      averageLatency: this.getAverageLatency(),
      recentRequests: this.metrics.slice(-10),
      totalRequests: this.metrics.length,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function withPerformanceTracking<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return (async (...args: any[]) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      performanceMonitor.record(name, Date.now() - start);
      return result;
    } catch (err) {
      performanceMonitor.record(name, Date.now() - start);
      throw err;
    }
  }) as T;
}
