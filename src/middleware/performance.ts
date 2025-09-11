import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

// Performance monitoring interface
interface PerformanceMetrics {
  path: string;
  method: string;
  duration: number;
  timestamp: Date;
  statusCode: number;
  userAgent?: string;
  ip?: string;
}

// In-memory store for performance metrics (in production, use Redis or database)
const performanceMetrics: PerformanceMetrics[] = [];
const SLOW_QUERY_THRESHOLD = 1000; // 1 second
const MAX_METRICS_STORED = 1000; // Keep only last 1000 metrics

// Performance monitoring middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();
  const startTime = new Date();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = performance.now() - start;
    const endTime = new Date();
    
    // Capture performance metrics
    const metrics: PerformanceMetrics = {
      path: req.path,
      method: req.method,
      duration,
      timestamp: endTime,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    // Store metrics
    performanceMetrics.push(metrics);
    
    // Keep only recent metrics
    if (performanceMetrics.length > MAX_METRICS_STORED) {
      performanceMetrics.shift();
    }
    
    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      console.warn(`🐌 SLOW QUERY DETECTED: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`, {
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        timestamp: endTime.toISOString()
      });
    }
    
    // Log PnL-specific queries for analysis
    if (req.path.includes('/pnl')) {
      console.log(`📊 PnL Query: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`, {
        query: req.query,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }
    
    // Call original end method and return its result
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Get performance metrics
export const getPerformanceMetrics = (): PerformanceMetrics[] => {
  return [...performanceMetrics];
};

// Get slow queries
export const getSlowQueries = (threshold: number = SLOW_QUERY_THRESHOLD): PerformanceMetrics[] => {
  return performanceMetrics.filter(metric => metric.duration > threshold);
};

// Get PnL-specific performance metrics
export const getPnLPerformanceMetrics = (): PerformanceMetrics[] => {
  return performanceMetrics.filter(metric => metric.path.includes('/pnl'));
};

// Get average response time for a specific path
export const getAverageResponseTime = (path: string): number => {
  const pathMetrics = performanceMetrics.filter(metric => metric.path === path);
  if (pathMetrics.length === 0) return 0;
  
  const totalDuration = pathMetrics.reduce((sum, metric) => sum + metric.duration, 0);
  return totalDuration / pathMetrics.length;
};

// Get performance statistics
export const getPerformanceStats = () => {
  const totalRequests = performanceMetrics.length;
  const slowRequests = getSlowQueries().length;
  const pnLRequests = getPnLPerformanceMetrics().length;
  
  const averageResponseTime = totalRequests > 0 
    ? performanceMetrics.reduce((sum, metric) => sum + metric.duration, 0) / totalRequests
    : 0;
  
  const slowestRequest = performanceMetrics.reduce((slowest, metric) => 
    metric.duration > slowest.duration ? metric : slowest, 
    { duration: 0 } as PerformanceMetrics
  );
  
  return {
    totalRequests,
    slowRequests,
    pnLRequests,
    averageResponseTime: Math.round(averageResponseTime * 100) / 100,
    slowestRequest: slowestRequest.duration > 0 ? {
      path: slowestRequest.path,
      method: slowestRequest.method,
      duration: slowestRequest.duration,
      timestamp: slowestRequest.timestamp
    } : null,
    slowQueryThreshold: SLOW_QUERY_THRESHOLD
  };
};

// Clear performance metrics
export const clearPerformanceMetrics = () => {
  performanceMetrics.length = 0;
};

export default performanceMiddleware;
