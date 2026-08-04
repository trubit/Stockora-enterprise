import type { Request, Response, NextFunction } from 'express';
import { TelemetryMetric } from '../models/TelemetryMetric.js';
import { logger } from '../logger.js';
import crypto from 'crypto';

export function telemetryMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Attach Correlation ID for distributed tracing (SRE standards)
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = req.baseUrl + req.path;
    const method = req.method;
    const status = res.statusCode.toString();

    // Log the request structured data
    logger.info(
      `[Observability] HTTP ${method} ${path} status=${status} duration=${duration}ms correlationId=${correlationId}`
    );

    // Asynchronously log metrics into database
    TelemetryMetric.create([
      {
        metricName: 'http_request_duration_ms',
        value: duration,
        labels: { path, method, status },
      },
      {
        metricName: 'http_requests_total',
        value: 1,
        labels: { path, method, status },
      },
    ]).catch((err) => {
      logger.error(`[Observability] Failed to store telemetry metric: ${err.message}`);
    });
  });

  next();
}
