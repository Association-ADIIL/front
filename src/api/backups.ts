import { fetchJson } from './client';

export interface Backup {
  key: string;
  date: string;
  size: number;
  sizeFormatted: string;
}

export interface BackupStatus {
  configured: boolean;
  retentionDays: number;
  cronExpression: string;
  backups: Backup[];
}

export const getBackupStatus = async (): Promise<BackupStatus> => {
  return fetchJson('/admin/backups');
};

export const triggerBackup = async (): Promise<{ message: string }> => {
  return fetchJson('/admin/backups/trigger', { method: 'POST' });
};
