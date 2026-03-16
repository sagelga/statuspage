import type { ServiceDefinition, ServiceResult, ServiceStatus } from '../types';
import { TIMEOUT_MS, DEGRADED_THRESHOLD_MS } from '../config';

async function checkWithTimeout(url: string, timeout: number): Promise<{
  statusCode: number | null;
  responseTime: number | null;
  error?: boolean;
}> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return {
      statusCode: response.status,
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return { statusCode: null, responseTime: null, error: true };
  }
}

function determineStatus(statusCode: number | null, responseTime: number | null): ServiceStatus {
  if (statusCode === null || responseTime === null) return 'down';
  if (statusCode >= 500) return 'down';
  if (responseTime > DEGRADED_THRESHOLD_MS) return 'degraded';
  if (statusCode >= 400) return 'degraded';
  return 'operational';
}

async function checkJsonStatus(
  url: string,
  path: string,
  map: Record<string, ServiceStatus>
): Promise<ServiceStatus> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return 'down';
    
    const data = await response.json();
    const value = String(path.split('.').reduce<any>((obj, key) => obj?.[key], data) ?? '');
    return map[value] || 'degraded';
  } catch {
    return 'down';
  }
}

export async function checkService(service: ServiceDefinition): Promise<ServiceResult> {
  let status: ServiceStatus;
  let statusCode: number | null = null;
  let responseTime: number | null = null;

  if (service.jsonStatus) {
    status = await checkJsonStatus(service.url, service.jsonStatus.path, service.jsonStatus.map);
  } else {
    const result = await checkWithTimeout(service.url, TIMEOUT_MS);
    statusCode = result.statusCode;
    responseTime = result.responseTime;
    status = determineStatus(statusCode, responseTime);
  }

  return {
    id: service.id,
    name: service.name,
    icon: service.icon,
    status,
    responseTime,
    statusCode,
  };
}

export async function checkAllServices(services: ServiceDefinition[]): Promise<ServiceResult[]> {
  return Promise.all(services.map(checkService));
}

export function calculateOverallStatus(services: ServiceResult[]): ServiceStatus {
  if (services.some(s => s.status === 'down')) return 'down';
  if (services.some(s => s.status === 'degraded')) return 'degraded';
  return 'operational';
}
