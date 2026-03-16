/**
 * Status Page Worker
 *
 * Routes:
 *   GET /                        — HTML status page
 *   GET /api/status              — JSON health check with 90-day history
 *   GET /api/minutes/:svc/:date  — Per-minute status array for mosaic hover
 */

import { SERVICES } from './config';
import type { StatusResponse, Env } from './types';
import { StatusPage } from './components/StatusPage';
import { checkAllServices, calculateOverallStatus } from './components/ServiceChecker';
import { createJsonResponse, createHtmlResponse, createErrorResponse } from './components/ResponseBuilder';
import { readAllDailyHistories, writeAllHistories, readMinuteHistory } from './components/HistoryManager';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    console.log(`[request] ${request.method} ${url.pathname}`);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Per-minute history for mosaic hover popup
    if (url.pathname.startsWith('/api/minutes/')) {
      const parts = url.pathname.split('/').filter(Boolean); // ['api', 'minutes', serviceId, date]
      const serviceId = parts[2];
      const date = parts[3];
      if (!serviceId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return createErrorResponse('Invalid request', 400);
      }
      if (!env.STATUS_HISTORY) {
        return new Response(JSON.stringify(new Array(1440).fill(null)), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      const minutes = await readMinuteHistory(env.STATUS_HISTORY, serviceId, date);
      return new Response(JSON.stringify(minutes), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    if (url.pathname === '/api/status') {
      const now = new Date();
      const services = await checkAllServices(SERVICES);
      const history = env.STATUS_HISTORY
        ? await readAllDailyHistories(env.STATUS_HISTORY, SERVICES.map((s) => s.id), now)
        : {};
      if (env.STATUS_HISTORY) {
        ctx.waitUntil(writeAllHistories(env.STATUS_HISTORY, services, now));
      }
      const data: StatusResponse = {
        status: calculateOverallStatus(services),
        checkedAt: now.toISOString(),
        services,
        history,
      };
      return createJsonResponse(data);
    }

    if (url.pathname === '/' || url.pathname === '') {
      const now = new Date();
      const services = await checkAllServices(SERVICES);
      const history = env.STATUS_HISTORY
        ? await readAllDailyHistories(env.STATUS_HISTORY, SERVICES.map((s) => s.id), now)
        : {};
      if (env.STATUS_HISTORY) {
        ctx.waitUntil(writeAllHistories(env.STATUS_HISTORY, services, now));
      }
      const data: StatusResponse = {
        status: calculateOverallStatus(services),
        checkedAt: now.toISOString(),
        services,
        history,
      };
      return createHtmlResponse(StatusPage({ data }));
    }

    return new Response('Not Found', { status: 404 });
  },

  /**
   * Cron Trigger Handler
   * Runs every minute (if configured in wrangler.toml) to ensure history is recorded
   * even when no users are visiting the status page.
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[scheduled] running periodic check at ${new Date(event.scheduledTime).toISOString()}`);
    if (!env.STATUS_HISTORY) {
      console.warn('[scheduled] skipping write: STATUS_HISTORY KV binding not found');
      return;
    }
    
    const now = new Date();
    const services = await checkAllServices(SERVICES);
    await writeAllHistories(env.STATUS_HISTORY, services, now);
    console.log('[scheduled] health check and history write complete');
  },
};
