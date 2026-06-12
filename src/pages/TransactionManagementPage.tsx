import React, { useEffect, useState, useMemo } from 'react';
import { logger } from '../utils/logger';
import { getAllTransactions, refreshTransactionStatus } from '../api/transactions';
import type { Transaction, TransactionType, PaymentStatus, PaymentMethod } from '../api/transactions';
import { Search, RefreshCw, CreditCard, ShoppingCart, Calendar, Eye, Clock, CheckCircle, XCircle, AlertCircle, Wallet, Banknote, Gift, User, Hash, FileText } from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNotification } from '../context/NotificationContext';

const ITEMS_PER_PAGE = 50;

const TYPE_LABELS: Record<TransactionType | 'BALANCE_CREDIT', string> = {
  ORDER: 'Commande',
  BALANCE_RECHARGE: 'Recharge',
  BALANCE_CREDIT: 'Crédit',
  INSCRIPTION: 'Inscription',
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payé',
  REFUNDED: 'Remboursé',
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  HELLOASSO: 'HelloAsso',
  PAYPAL: 'PayPal',
  CASH_CB: 'Espèces/CB',
  FREE: 'Gratuit',
  BALANCE: 'Solde',
};

// Format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const TransactionManagementPage: React.FC = () => {
  useDocumentTitle('Admin - Transactions');
  const { addNotification } = useNotification();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getAllTransactions();
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      logger.error('Failed to fetch transactions', error);
      addNotification('error', 'Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = transactions.filter(tx => {
      const matchesSearch =
        tx.user.firstName.toLowerCase().includes(lowerTerm) ||
        tx.user.lastName.toLowerCase().includes(lowerTerm) ||
        tx.user.email.toLowerCase().includes(lowerTerm) ||
        tx.description.toLowerCase().includes(lowerTerm) ||
        tx.paymentTransactionId?.toLowerCase().includes(lowerTerm) ||
        tx.entityId.toString().includes(lowerTerm);

      const matchesType = !typeFilter || tx.type === typeFilter;
      const matchesStatus = !statusFilter || tx.paymentStatus === statusFilter;
      const matchesMethod = !methodFilter || tx.paymentMethod === methodFilter;

      return matchesSearch && matchesType && matchesStatus && matchesMethod;
    });
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, methodFilter, transactions]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Calculate stats
  const stats = useMemo(() => {
    const pending = transactions.filter(t => t.paymentStatus === 'PENDING');
    const paid = transactions.filter(t => t.paymentStatus === 'PAID');
    const refunded = transactions.filter(t => t.paymentStatus === 'REFUNDED');
    const totalRevenue = paid.reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      total: transactions.length,
      pending: pending.length,
      paid: paid.length,
      refunded: refunded.length,
      totalRevenue,
    };
  }, [transactions]);

  const handleRefreshStatus = async (tx: Transaction) => {
    if (tx.paymentStatus === 'PAID') {
      addNotification('info', 'Cette transaction est déjà marquée comme payée');
      return;
    }

    if (tx.paymentMethod === 'CASH_CB' || tx.paymentMethod === 'FREE' || tx.paymentMethod === 'BALANCE') {
      addNotification('info', 'Cette méthode de paiement ne supporte pas le rafraîchissement automatique');
      return;
    }

    if (!tx.paymentTransactionId) {
      addNotification('error', 'Aucun ID de transaction pour vérifier le statut');
      return;
    }

    setRefreshingId(tx.id);
    try {
      const result = await refreshTransactionStatus(tx.type, tx.entityId);

      if (result.updated) {
        addNotification('success', `Statut mis à jour: ${result.status}`);
        fetchTransactions();
      } else {
        addNotification('info', `Aucun changement. Statut: ${result.providerStatus || 'N/A'}`);
      }
    } catch (error) {
      logger.error('Failed to refresh status', error);
      addNotification('error', (error as any).message || 'Erreur lors du rafraîchissement');
    } finally {
      setRefreshingId(null);
    }
  };

  const handleOpenDetail = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setIsDetailModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number | undefined | null, bonus?: number) => {
    const safeAmount = amount ?? 0;
    if (bonus && bonus > 0) {
      return (
        <span>
          {safeAmount.toFixed(2)}€ <span className="text-green-400">(+{bonus.toFixed(2)}€)</span>
        </span>
      );
    }
    return `${safeAmount.toFixed(2)}€`;
  };

  const getDisplayType = (tx: Transaction): TransactionType | 'BALANCE_CREDIT' => {
    if (tx.type === 'BALANCE_RECHARGE' && tx.paymentTransactionId?.startsWith('ADMIN_')) {
      return 'BALANCE_CREDIT';
    }
    return tx.type;
  };

  const getTypeConfig = (type: TransactionType | 'BALANCE_CREDIT') => {
    switch (type) {
      case 'ORDER':
        return { icon: ShoppingCart, bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' };
      case 'BALANCE_RECHARGE':
        return { icon: CreditCard, bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' };
      case 'BALANCE_CREDIT':
        return { icon: Gift, bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' };
      case 'INSCRIPTION':
        return { icon: Calendar, bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' };
    }
  };

  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return { icon: CheckCircle, bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' };
      case 'PENDING':
        return { icon: Clock, bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' };
      case 'REFUNDED':
        return { icon: XCircle, bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' };
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'PAYPAL':
      case 'HELLOASSO':
        return CreditCard;
      case 'CASH_CB':
        return Banknote;
      case 'FREE':
        return Gift;
      case 'BALANCE':
        return Wallet;
    }
  };

  const canRefresh = (tx: Transaction) => {
    return (
      tx.paymentStatus === 'PENDING' &&
      (tx.paymentMethod === 'PAYPAL' || tx.paymentMethod === 'HELLOASSO') &&
      tx.paymentTransactionId
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 bg-pink-500 rounded-full hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-[10px] font-bold rounded-full uppercase tracking-wide">Finances</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white font-koulen">TRANSACTIONS</h1>
            <p className="text-gray-500 text-sm mt-1">Historique des paiements et recharges</p>
          </div>
        </div>
        <button
          onClick={fetchTransactions}
          className="bg-pink-500 hover:bg-pink-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap hover:shadow-lg hover:shadow-pink-500/20"
        >
          <RefreshCw size={18} /> Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-darker-bg p-4 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700/50 rounded-xl flex items-center justify-center">
              <Hash size={18} className="text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-xl font-koulen text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-darker-bg p-4 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">En attente</p>
              <p className="text-xl font-koulen text-yellow-400">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-darker-bg p-4 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-green-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Payées</p>
              <p className="text-xl font-koulen text-green-400">{stats.paid}</p>
            </div>
          </div>
        </div>
        <div className="bg-darker-bg p-4 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <XCircle size={18} className="text-red-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Remboursées</p>
              <p className="text-xl font-koulen text-red-400">{stats.refunded}</p>
            </div>
          </div>
        </div>
        <div className="bg-darker-bg p-4 rounded-2xl border border-gray-800 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Wallet size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Revenu total</p>
              <p className="text-xl font-koulen text-emerald-400">{stats.totalRevenue.toFixed(2)}€</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-darker-bg border border-gray-800 rounded-2xl p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-grow md:flex-grow-0">
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-dark-bg border border-gray-700 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none w-full md:w-56 transition-colors"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as TransactionType | '')}
            className="bg-dark-bg border border-gray-700 rounded-xl py-2.5 px-4 text-white focus:border-pink-500/50 focus:outline-none transition-colors"
          >
            <option value="">Tous types</option>
            <option value="ORDER">Commandes</option>
            <option value="BALANCE_RECHARGE">Recharges</option>
            <option value="INSCRIPTION">Inscriptions</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as PaymentStatus | '')}
            className="bg-dark-bg border border-gray-700 rounded-xl py-2.5 px-4 text-white focus:border-pink-500/50 focus:outline-none transition-colors"
          >
            <option value="">Tous statuts</option>
            <option value="PENDING">En attente</option>
            <option value="PAID">Payé</option>
            <option value="REFUNDED">Remboursé</option>
          </select>
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value as PaymentMethod | '')}
            className="bg-dark-bg border border-gray-700 rounded-xl py-2.5 px-4 text-white focus:border-pink-500/50 focus:outline-none transition-colors"
          >
            <option value="">Toutes méthodes</option>
            <option value="HELLOASSO">HelloAsso</option>
            <option value="PAYPAL">PayPal</option>
            <option value="CASH_CB">Espèces/CB</option>
            <option value="FREE">Gratuit</option>
            <option value="BALANCE">Solde ADIIL</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-darker-bg border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-dark-bg border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Méthode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <AlertCircle size={40} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-500">Aucune transaction trouvée</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(tx => {
                  const displayType = getDisplayType(tx);
                  const typeConfig = getTypeConfig(displayType);
                  const statusConfig = getStatusConfig(tx.paymentStatus);
                  const TypeIcon = typeConfig.icon;
                  const StatusIcon = statusConfig.icon;
                  const MethodIcon = getMethodIcon(tx.paymentMethod);

                  return (
                    <tr key={tx.id} className="hover:bg-dark-bg/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${typeConfig.bg} border ${typeConfig.border}`}>
                          <TypeIcon size={14} className={typeConfig.text} />
                          <span className={`text-xs font-medium ${typeConfig.text} hidden sm:inline`}>{TYPE_LABELS[displayType]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {tx.user.firstName[0]}{tx.user.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white capitalize">{tx.user.firstName} {tx.user.lastName}</p>
                            <p className="text-xs text-gray-500 hidden sm:block">{tx.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-sm text-gray-300 max-w-xs truncate">{tx.description}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm font-koulen text-white">{formatAmount(tx.amount, tx.bonusAmount)}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <MethodIcon size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-300">{METHOD_LABELS[tx.paymentMethod]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bg} border ${statusConfig.border}`}>
                          <StatusIcon size={12} className={statusConfig.text} />
                          <span className={`text-xs font-medium ${statusConfig.text}`}>{STATUS_LABELS[tx.paymentStatus]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                        <div className="flex flex-col">
                          <span className="text-sm text-white">{formatRelativeTime(tx.createdAt)}</span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetail(tx)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <Eye size={16} />
                          </button>
                          {canRefresh(tx) && (
                            <button
                              onClick={() => handleRefreshStatus(tx)}
                              disabled={refreshingId === tx.id}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Rafraîchir le statut"
                            >
                              <RefreshCw size={16} className={refreshingId === tx.id ? 'animate-spin' : ''} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredTransactions.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Détails de la transaction"
      >
        {selectedTransaction && (() => {
          const displayType = getDisplayType(selectedTransaction);
          const typeConfig = getTypeConfig(displayType);
          const statusConfig = getStatusConfig(selectedTransaction.paymentStatus);
          const TypeIcon = typeConfig.icon;
          const StatusIcon = statusConfig.icon;

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-700">
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${typeConfig.bg} border ${typeConfig.border}`}>
                  <TypeIcon size={18} className={typeConfig.text} />
                  <span className={`font-medium ${typeConfig.text}`}>{TYPE_LABELS[displayType]}</span>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${statusConfig.bg} border ${statusConfig.border}`}>
                  <StatusIcon size={18} className={statusConfig.text} />
                  <span className={`font-medium ${statusConfig.text}`}>{STATUS_LABELS[selectedTransaction.paymentStatus]}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-center py-4 bg-dark-bg rounded-xl border border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Montant</p>
                <p className="text-4xl font-koulen text-emerald-400">
                  {formatAmount(selectedTransaction.amount, selectedTransaction.bonusAmount)}
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-dark-bg rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <User size={18} className="text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Utilisateur</p>
                      <p className="text-white font-medium capitalize truncate">
                        {selectedTransaction.user.firstName} {selectedTransaction.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{selectedTransaction.user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-bg rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <CreditCard size={18} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Méthode</p>
                      <p className="text-white font-medium">{METHOD_LABELS[selectedTransaction.paymentMethod]}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-bg rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <Hash size={18} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">ID Entité</p>
                      <p className="text-white font-medium">#{selectedTransaction.entityId}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-bg rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                      <Calendar size={18} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Date</p>
                      <p className="text-white font-medium">{formatDate(selectedTransaction.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-dark-bg rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-gray-400" />
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Description</p>
                </div>
                <p className="text-white">{selectedTransaction.description}</p>
              </div>

              {/* Transaction ID */}
              {selectedTransaction.paymentTransactionId && (
                <div className="bg-dark-bg rounded-xl p-4 border border-gray-700">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">ID Transaction Provider</p>
                  <p className="text-white font-mono text-sm break-all bg-darker-bg p-2 rounded-lg">
                    {selectedTransaction.paymentTransactionId}
                  </p>
                </div>
              )}

              {/* Refresh Button */}
              {canRefresh(selectedTransaction) && (
                <button
                  onClick={() => {
                    handleRefreshStatus(selectedTransaction);
                    setIsDetailModalOpen(false);
                  }}
                  disabled={refreshingId === selectedTransaction.id}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} className={refreshingId === selectedTransaction.id ? 'animate-spin' : ''} />
                  Rafraîchir le statut depuis le provider
                </button>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default TransactionManagementPage;
