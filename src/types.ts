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
  dailyUptime?: Record<string, (number | null)[]>;
  /** (operational + degraded) / total — service was responding, even if slow */
  dailyFuncUptime?: Record<string, (number | null)[]>;
}

/** Fast-path payload: current badges only — history/uptime may be empty or omitted. */
export type CurrentStatusResponse = Pick<StatusResponse, 'status' | 'checkedAt' | 'services'> &
  Partial<Pick<StatusResponse, 'history' | 'dailyUptime' | 'dailyFuncUptime'>>;

// Theme and Cookie types
export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  children?: NavItem[];
  disabled?: boolean;
}

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export type Theme = "light" | "dark" | "system";

export interface CookiePreferences {
  functional: boolean;
  analytics: boolean;
  consentGiven: boolean;
  consentTimestamp: number | null;
}

export const COOKIE_STORAGE_KEY = "cookie-preferences";
export const THEME_STORAGE_KEY = "theme-preference";
