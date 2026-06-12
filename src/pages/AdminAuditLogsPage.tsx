import React, { useEffect, useState, useMemo } from 'react';
import { logger } from '../utils/logger';
import { getRecentAuditLogs } from '../api/auditLogs';
import { FileText, User, Calendar, Filter, Eye, Search, X, Plus, Pencil, Trash2, CreditCard, RefreshCw, XCircle, UserPlus, Package } from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const ITEMS_PER_PAGE = 50;

// Format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

interface AuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: number;
  details: string | null;
  createdAt: string;
}

const AdminAuditLogsPage: React.FC = () => {
  useDocumentTitle('Admin - Logs');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getRecentAuditLogs(200);
        setLogs(data);
        setFilteredLogs(data);
      } catch (error) {
        logger.error('Error fetching audit logs', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (filterAction) {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    if (filterEntityType) {
      filtered = filtered.filter(log => log.entityType === filterEntityType);
    }

    if (filterUser) {
      filtered = filtered.filter(log =>
        log.userName?.toLowerCase().includes(filterUser.toLowerCase())
      );
    }

    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      filtered = filtered.filter(log => new Date(log.createdAt) >= fromDate);
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => new Date(log.createdAt) <= toDate);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [filterAction, filterEntityType, filterUser, filterDateFrom, filterDateTo, logs]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const clearFilters = () => {
    setFilterAction('');
    setFilterEntityType('');
    setFilterUser('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasActiveFilters = filterAction || filterEntityType || filterUser || filterDateFrom || filterDateTo;

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'UPDATE':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'DELETE':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'CONFIRM_PAYMENT':
        return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
      case 'REFUND':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'CANCEL':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'MANUAL_INSCRIPTION':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'MARK_COLLECTED':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'BALANCE_RECHARGE':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'BALANCE_PURCHASE':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getEntityTypeBadgeColor = (entityType: string) => {
    switch (entityType) {
      case 'EVENT':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'PRODUCT':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      case 'INSCRIPTION':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ORDER':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'USER':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'FILE':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'CATEGORY':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'SUBCATEGORY':
        return 'bg-lime-500/20 text-lime-400 border-lime-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE: 'Creation',
      UPDATE: 'Modification',
      DELETE: 'Suppression',
      CONFIRM_PAYMENT: 'Paiement confirme',
      REFUND: 'Remboursement',
      CANCEL: 'Annulation',
      MANUAL_INSCRIPTION: 'Inscription manuelle',
      MARK_COLLECTED: 'Marque recupere',
      BALANCE_RECHARGE: 'Recharge Solde ADIIL',
      BALANCE_PURCHASE: 'Achat Solde ADIIL',
    };
    return labels[action] || action;
  };

  const formatEntityTypeLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      EVENT: 'Evenement',
      PRODUCT: 'Produit',
      INSCRIPTION: 'Inscription',
      ORDER: 'Commande',
      USER: 'Utilisateur',
      FILE: 'Fichier',
      CATEGORY: 'Categorie',
      SUBCATEGORY: 'Sous-categorie',
    };
    return labels[entityType] || entityType;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Plus size={14} />;
      case 'UPDATE':
        return <Pencil size={14} />;
      case 'DELETE':
        return <Trash2 size={14} />;
      case 'CONFIRM_PAYMENT':
        return <CreditCard size={14} />;
      case 'REFUND':
        return <RefreshCw size={14} />;
      case 'CANCEL':
        return <XCircle size={14} />;
      case 'MANUAL_INSCRIPTION':
        return <UserPlus size={14} />;
      case 'MARK_COLLECTED':
        return <Package size={14} />;
      case 'BALANCE_RECHARGE':
        return <CreditCard size={14} />;
      case 'BALANCE_PURCHASE':
        return <Package size={14} />;
      default:
        return <FileText size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  const uniqueEntityTypes = Array.from(new Set(logs.map(log => log.entityType)));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-1 h-12 bg-gray-500 rounded-full hidden sm:block" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-wide">Systeme</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-koulen text-white">LOGS D'AUDIT</h1>
          <p className="text-gray-500 text-sm mt-1">Historique de toutes les actions administratives</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-darker-bg p-6 rounded-2xl border border-gray-800 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Filter size={20} className="text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Filtres</h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
              Effacer les filtres
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Search user */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Utilisateur</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-dark-bg border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {/* Action filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full bg-dark-bg border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gray-400"
            >
              <option value="">Toutes les actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{formatActionLabel(action)}</option>
              ))}
            </select>
          </div>

          {/* Entity type filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Type d'entite</label>
            <select
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
              className="w-full bg-dark-bg border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gray-400"
            >
              <option value="">Tous les types</option>
              {uniqueEntityTypes.map(type => (
                <option key={type} value={type}>{formatEntityTypeLabel(type)}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Date debut</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full bg-dark-bg border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gray-400"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Date fin</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full bg-dark-bg border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-dark-bg border-b border-gray-800">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Utilisateur</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Cible</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-12 text-center text-gray-400">
                    Aucun log trouve
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-dark-bg/50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-xs sm:text-sm">
                          {formatRelativeTime(log.createdAt)}
                        </span>
                        <span className="text-[10px] text-gray-500 hidden sm:block">
                          {new Date(log.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-300 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-500" />
                        <span className="truncate max-w-[150px]" title={log.userName || 'Systeme'}>
                          {log.userName || 'Systeme'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionBadgeColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        <span className="hidden sm:inline">{formatActionLabel(log.action)}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${getEntityTypeBadgeColor(log.entityType)}`}>
                          {formatEntityTypeLabel(log.entityType)}
                        </span>
                        <span className="text-[10px] text-gray-500">ID: {log.entityId}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                        title="Voir les details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredLogs.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Details du Log"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-400">Date et Heure</h3>
                <p className="text-white flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  {new Date(selectedLog.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-400">Auteur de l'action</h3>
                <p className="text-white flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  {selectedLog.userName || 'Systeme'}
                  <span className="text-xs text-gray-500">(ID: {selectedLog.userId || 'N/A'})</span>
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-400">Action</h3>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getActionBadgeColor(selectedLog.action)}`}>
                    {formatActionLabel(selectedLog.action)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-400">Entite concernee</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEntityTypeBadgeColor(selectedLog.entityType)}`}>
                    {formatEntityTypeLabel(selectedLog.entityType)}
                  </span>
                  <span className="text-gray-400 text-sm">ID: {selectedLog.entityId}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                Détails de l'action
              </h3>
              {(() => {
                if (!selectedLog.details) {
                  return (
                    <p className="text-gray-500 text-sm italic">Aucun détail supplémentaire disponible.</p>
                  );
                }
                try {
                  const parsed = JSON.parse(selectedLog.details);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(parsed).map(([key, value]) => (
                        <div key={key} className="bg-dark-bg rounded-lg p-3 border border-gray-700">
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-white font-medium text-sm break-all">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                } catch (e) {
                  return (
                    <div className="bg-dark-bg rounded-xl p-4 border border-gray-700 overflow-x-auto">
                      <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-all">
                        {selectedLog.details}
                      </pre>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAuditLogsPage;
