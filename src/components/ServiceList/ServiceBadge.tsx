import React from 'react';
import { StatusLabels } from '@/components/Icons';
import type { ServiceStatus } from '@/types';

/** Loaded status pill with dot + Thai label. */
export function StatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <span className={`badge status-loaded ${status}`}>
      <span className="dot" />
      {StatusLabels[status] || status}
    </span>
  );
}

/** Skeleton pill shown before a service's first response. */
export function LoadingBadge() {
  return (
    <span className="badge loading">
      <span className="dot" />
      กำลังโหลด
    </span>
  );
}
