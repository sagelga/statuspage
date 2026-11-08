import type { ServiceStatus } from '@/types';

/** Day currently open in a service's minute mosaic. */
export interface ExpandedDay {
  serviceId: string;
  dayIndex: number;
  dateStr: string;
  label: string;
  minutes: (ServiceStatus | 'nodata')[];
  loading: boolean;
  locked: boolean;
  /** History map this selection was opened against (auto-closes on refresh). */
  historyVersion?: object;
}
