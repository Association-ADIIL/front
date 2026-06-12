import { fetchJson } from './client';

export interface AuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: number;
  details: string | null;
  createdAt: string;
}

export const getRecentAuditLogs = async (limit: number = 100): Promise<AuditLog[]> => {
  return fetchJson(`/admin/audit-logs?limit=${limit}`);
};

export const getAuditLogsForEntity = async (
  entityType: string,
  entityId: number,
  limit: number = 50
): Promise<AuditLog[]> => {
  return fetchJson(`/admin/audit-logs/${entityType}/${entityId}?limit=${limit}`);
};
