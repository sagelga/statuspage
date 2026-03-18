export type ServiceStatus = 'operational' | 'degraded' | 'down';

export interface ServiceDefinition {
  id: string;
  name: string;
  icon: string;
  url: string;
  jsonStatus?: { path: string; map: Record<string, ServiceStatus> };
}

export interface ServiceResult extends Omit<ServiceDefinition, 'url'> {
  status: ServiceStatus;
  responseTime: number | null;
  statusCode: number | null;
}

export interface StatusResponse {
  status: ServiceStatus;
  checkedAt: string;
  services: ServiceResult[];
  history: Record<string, (ServiceStatus | 'nodata')[]>;
}

export interface HistoryMeta {
  services: Record<string, ServiceStatus>;
}

export interface Env {
  STATUS_HISTORY?: unknown;
}
