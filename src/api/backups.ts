import { fetchJson } from './client';

export interface Backup {
  key: string;
  date: string;
  size: number;
  sizeFormatted: string;
  locked: boolean;
}

export interface BackupStatus {
  configured: boolean;
  retentionDays: number;
  minKeepBackups: number;
  cronExpression: string;
  backups: Backup[];
}

export const getBackupStatus = async (): Promise<BackupStatus> => {
  return fetchJson('/admin/backups');
};

export const triggerBackup = async (): Promise<{ message: string }> => {
  return fetchJson('/admin/backups/trigger', { method: 'POST' });
};

export const setBackupLock = async (key: string, locked: boolean): Promise<{ message: string }> => {
  return fetchJson('/admin/backups/lock', {
    method: 'POST',
    body: JSON.stringify({ key, locked }),
  });
};
