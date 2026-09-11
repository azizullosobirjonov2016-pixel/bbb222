import { onCLS, onINP, onFCP, onLCP, type Metric } from 'web-vitals';
import { logger } from './logger';

/**
 * Web Vitals Performance Metrics Tracking
 *
 * Tracks Core Web Vitals metrics for performance monitoring:
 * - CLS (Cumulative Layout Shift) - Visual stability
 * - INP (Interaction to Next Paint) - Interactivity responsiveness
 * - FCP (First Contentful Paint) - Load speed (first paint)
 * - LCP (Largest Contentful Paint) - Load speed (main content)
 *
 * For production, integrate with Sentry or other monitoring service
 */

interface PerformanceData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Send metric to analytics/monitoring service
 * @param data Web Vitals metric
 */
function sendMetric(data: Metric) {
  const perfData: PerformanceData = {
    name: data.name,
    value: Math.round(data.value * 100) / 100,
    rating: data.rating || 'needs-improvement',
    delta: Math.round(data.delta * 100) / 100,
    id: data.id,
  };

  // Log in development
  logger.info(
    `📊 Web Vital [${perfData.name}]: ${perfData.value}ms (${perfData.rating})`,
  );

  // Send to Sentry if configured
  const sentryWindow = window as typeof window & {
    __SENTRY__?: {
      captureMessage: (message: string, level: string, extra: unknown) => void;
    };
  };
  if (typeof window !== 'undefined' && sentryWindow.__SENTRY__) {
    sentryWindow.__SENTRY__.captureMessage(
      `Performance metric: ${perfData.name}`,
      'info',
      {
        tags: {
          'web-vital': perfData.name,
          rating: perfData.rating,
        },
        contexts: {
          trace: {
            op: 'performance',
            description: perfData.name,
          },
        },
        measurements: {
          [perfData.name.toLowerCase()]: {
            value: perfData.value,
          },
        },
      },
    );
  }

  // Send to custom analytics endpoint
  if (import.meta.env.VITE_ANALYTICS_URL) {
    fetch(import.meta.env.VITE_ANALYTICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'web-vital',
        timestamp: new Date().toISOString(),
        ...perfData,
      }),
    }).catch(() => {
      // Silently fail - don't disrupt app for analytics failure
    });
  }
}

/**
 * Initialize Web Vitals performance tracking
 * Should be called once after React app renders
 */
export function initPerformanceTracking(): void {
  if (typeof window === 'undefined') return;

  try {
    // Track Cumulative Layout Shift (visual stability)
    onCLS(sendMetric);

    // Track Interaction to Next Paint (interactivity)
    onINP(sendMetric);

    // Track First Contentful Paint (load speed - first paint)
    onFCP(sendMetric);

    // Track Largest Contentful Paint (load speed - main content)
    onLCP(sendMetric);

    logger.info('✅ Web Vitals tracking initialized');
  } catch (error) {
    // Silently fail - performance monitoring shouldn't break the app
    logger.warn('Performance tracking initialization failed', error);
  }
}

/**
 * Get current performance metrics (DevTools only)
 * Useful for debugging performance issues during development
 */
export function getPerformanceMetrics() {
  if (typeof window === 'undefined') return null;

  const navigation = performance.getEntriesByType(
    'navigation',
  )[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    navigationTiming: {
      domContentLoaded:
        navigation?.domContentLoadedEventEnd -
        navigation?.domContentLoadedEventStart,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
      timeToFirstByte: navigation?.responseStart - navigation?.requestStart,
    },
    paint: paint.map((entry) => ({
      name: entry.name,
      startTime: Math.round(entry.startTime * 100) / 100,
    })),
  };
}

/**
 * Log current performance for debugging (dev mode only)
 */
export function logPerformanceDebug(): void {
  if (import.meta.env.DEV) {
    const metrics = getPerformanceMetrics();
    logger.debug('Performance Metrics:', metrics);
  }
}
