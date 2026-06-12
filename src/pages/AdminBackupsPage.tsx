import React, { useEffect, useState } from 'react';
import { logger } from '../utils/logger';
import { getBackupStatus, triggerBackup, setBackupLock, type BackupStatus } from '../api/backups';
import { Database, HardDrive, Clock, Calendar, RefreshCw, Play, CheckCircle, AlertCircle, Server, Shield, Lock, Unlock } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNotification } from '../context/NotificationContext';

// Format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffDays < 30) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Parse cron expression to human readable
const parseCronExpression = (cron: string): string => {
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;

  const [minute, hour] = parts;
  return `Tous les jours a ${hour}h${minute.padStart(2, '0')}`;
};

const AdminBackupsPage: React.FC = () => {
  useDocumentTitle('Admin - Backups');
  const { addNotification } = useNotification();
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [lockingKey, setLockingKey] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await getBackupStatus();
      setStatus(data);
    } catch (error) {
      logger.error('Error fetching backup status', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTriggerBackup = async () => {
    if (triggering) return;

    setTriggering(true);
    try {
      await triggerBackup();
      addNotification('success', 'Backup lance en arriere-plan. Rafraichissez dans quelques instants.');
    } catch (error) {
      logger.error('Error triggering backup', error);
      addNotification('error', 'Erreur lors du lancement du backup');
    } finally {
      setTriggering(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchStatus();
  };

  const handleToggleLock = async (key: string, currentlyLocked: boolean) => {
    setLockingKey(key);
    try {
      await setBackupLock(key, !currentlyLocked);
      addNotification('success', currentlyLocked ? 'Backup deverrouille' : 'Backup verrouille');
      fetchStatus();
    } catch (error) {
      logger.error('Error toggling backup lock', error);
      addNotification('error', 'Erreur lors du verrouillage');
    } finally {
      setLockingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 bg-teal-500 rounded-full hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 text-[10px] font-bold rounded-full uppercase tracking-wide">Systeme</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-koulen text-white">BACKUPS BASE DE DONNEES</h1>
            <p className="text-gray-500 text-sm mt-1">Sauvegardes automatiques sur Cloudflare R2</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
          title="Rafraichir"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Configuration Status */}
        <div className="bg-darker-bg p-5 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status?.configured ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {status?.configured ? (
                <CheckCircle size={20} className="text-green-400" />
              ) : (
                <AlertCircle size={20} className="text-red-400" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Statut</p>
              <p className={`font-bold ${status?.configured ? 'text-green-400' : 'text-red-400'}`}>
                {status?.configured ? 'Configure' : 'Non configure'}
              </p>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-darker-bg p-5 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Planification</p>
              <p className="font-bold text-white">
                {status?.cronExpression ? parseCronExpression(status.cronExpression) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Retention */}
        <div className="bg-darker-bg p-5 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Retention</p>
              <p className="font-bold text-white">{status?.retentionDays || 30} jours</p>
            </div>
          </div>
        </div>

        {/* Minimum kept */}
        <div className="bg-darker-bg p-5 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Minimum garde</p>
              <p className="font-bold text-white">{status?.minKeepBackups || 3} backups</p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Backup Button */}
      {status?.configured && (
        <div className="bg-darker-bg p-5 rounded-2xl border border-gray-800 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
                <Database size={20} className="text-teal-400" />
              </div>
              <div>
                <p className="font-bold text-white">Backup manuel</p>
                <p className="text-sm text-gray-500">Lancer une sauvegarde immediate</p>
              </div>
            </div>
            <button
              onClick={handleTriggerBackup}
              disabled={triggering}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/50 text-darker-bg font-bold rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              {triggering ? (
                <>
                  <div className="w-4 h-4 border-2 border-darker-bg border-t-transparent rounded-full animate-spin" />
                  <span>En cours...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Lancer</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Backups List */}
      <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Server size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">Historique des backups</h2>
              <p className="text-sm text-gray-500">{status?.backups.length || 0} sauvegarde(s) disponible(s)</p>
            </div>
          </div>
        </div>

        {!status?.configured ? (
          <div className="p-12 text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Service de backup non configure</p>
            <p className="text-sm text-gray-500">
              Verifiez que les variables R2_PRIVATE_* sont definies dans le .env du backend
            </p>
          </div>
        ) : status.backups.length === 0 ? (
          <div className="p-12 text-center">
            <Database size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun backup disponible</p>
            <p className="text-sm text-gray-500 mt-2">
              Lancez un backup manuel ou attendez le prochain backup automatique
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-dark-bg border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Fichier</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Taille</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Verrou</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {status.backups.map((backup, index) => {
                  const isAutoProtected = index < (status?.minKeepBackups || 3);
                  const isLocked = backup.locked;
                  return (
                    <tr key={backup.key} className="hover:bg-dark-bg/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            index === 0 ? 'bg-green-500/20' :
                            isLocked ? 'bg-yellow-500/20' :
                            isAutoProtected ? 'bg-orange-500/20' : 'bg-gray-800'
                          }`}>
                            {isLocked ? (
                              <Lock size={14} className="text-yellow-400" />
                            ) : isAutoProtected ? (
                              <Shield size={14} className={index === 0 ? 'text-green-400' : 'text-orange-400'} />
                            ) : (
                              <HardDrive size={14} className="text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm flex items-center gap-2 flex-wrap">
                              {formatRelativeTime(backup.date)}
                              {index === 0 && (
                                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">
                                  Dernier
                                </span>
                              )}
                              {isLocked && (
                                <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded-full flex items-center gap-1">
                                  <Lock size={8} />
                                  Verrouille
                                </span>
                              )}
                              {isAutoProtected && !isLocked && (
                                <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] rounded-full flex items-center gap-1">
                                  <Shield size={8} />
                                  Auto
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {new Date(backup.date).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <code className="text-xs text-gray-400 bg-dark-bg px-2 py-1 rounded">
                          {backup.key.split('/').pop()}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-300 font-medium">{backup.sizeFormatted}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleLock(backup.key, isLocked)}
                          disabled={lockingKey === backup.key}
                          className={`p-2 rounded-lg transition-colors ${
                            isLocked
                              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                          } disabled:opacity-50`}
                          title={isLocked ? 'Deverrouiller' : 'Verrouiller'}
                        >
                          {lockingKey === backup.key ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : isLocked ? (
                            <Unlock size={16} />
                          ) : (
                            <Lock size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Database size={14} className="text-blue-400" />
          </div>
          <div className="text-sm">
            <p className="text-blue-400 font-medium mb-1">A propos des backups</p>
            <ul className="text-gray-400 space-y-1 text-xs">
              <li>Les backups sont compresses en gzip et stockes sur Cloudflare R2</li>
              <li>Les sauvegardes de plus de {status?.retentionDays || 30} jours sont automatiquement supprimees</li>
              <li>Les {status?.minKeepBackups || 3} backups les plus recents sont automatiquement proteges (badge "Auto")</li>
              <li>Vous pouvez verrouiller manuellement un backup pour le garder indefiniment (badge "Verrouille")</li>
              <li>Les backups contiennent l'integralite de la base de donnees (structure + donnees)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBackupsPage;
