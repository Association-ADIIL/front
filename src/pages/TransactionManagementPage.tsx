import React, { useEffect, useState } from 'react';
import { getAllTransactions, refreshTransactionStatus } from '../api/transactions';
import type { Transaction, TransactionType, PaymentStatus, PaymentMethod } from '../api/transactions';
import { Search, RefreshCw, CreditCard, ShoppingCart, Calendar, ExternalLink } from 'lucide-react';
import Modal from '../components/Modal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNotification } from '../context/NotificationContext';

const TYPE_LABELS: Record<TransactionType | 'BALANCE_CREDIT', string> = {
  ORDER: 'Commande',
  BALANCE_RECHARGE: 'Recharge',
  BALANCE_CREDIT: 'Crédit ADIIL',
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
  BALANCE: 'Solde ADIIL',
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

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getAllTransactions();
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
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
  }, [searchTerm, typeFilter, statusFilter, methodFilter, transactions]);

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
        addNotification('success', `Statut mis à jour: ${result.status} (Provider: ${result.providerStatus})`);
        fetchTransactions();
      } else {
        addNotification('info', `Aucun changement. Statut provider: ${result.providerStatus || 'N/A'}`);
      }
    } catch (error: any) {
      console.error('Failed to refresh status:', error);
      addNotification('error', error.message || 'Erreur lors du rafraîchissement');
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
      return `${safeAmount.toFixed(2)}€ (+${bonus.toFixed(2)}€)`;
    }
    return `${safeAmount.toFixed(2)}€`;
  };

  // Helper to determine display type (detect admin credits)
  const getDisplayType = (tx: Transaction): TransactionType | 'BALANCE_CREDIT' => {
    if (tx.type === 'BALANCE_RECHARGE' && tx.paymentTransactionId?.startsWith('ADMIN_')) {
      return 'BALANCE_CREDIT';
    }
    return tx.type;
  };

  const getTypeIcon = (type: TransactionType | 'BALANCE_CREDIT') => {
    switch (type) {
      case 'ORDER':
        return <ShoppingCart size={16} />;
      case 'BALANCE_RECHARGE':
        return <CreditCard size={16} />;
      case 'BALANCE_CREDIT':
        return <CreditCard size={16} />;
      case 'INSCRIPTION':
        return <Calendar size={16} />;
    }
  };

  const getStatusBadgeClass = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-900/50 text-green-200';
      case 'PENDING':
        return 'bg-yellow-900/50 text-yellow-200';
      case 'REFUNDED':
        return 'bg-red-900/50 text-red-200';
    }
  };

  const getTypeBadgeClass = (type: TransactionType | 'BALANCE_CREDIT') => {
    switch (type) {
      case 'ORDER':
        return 'bg-blue-900/50 text-blue-200';
      case 'BALANCE_RECHARGE':
        return 'bg-purple-900/50 text-purple-200';
      case 'BALANCE_CREDIT':
        return 'bg-green-900/50 text-green-200';
      case 'INSCRIPTION':
        return 'bg-cyan-900/50 text-cyan-200';
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
    return <div className="text-center p-8">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-accent-mint font-koulen">TRANSACTIONS</h1>
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <div className="relative flex-grow md:flex-grow-0">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-darker-bg border border-gray-700 rounded-md py-2 pl-10 pr-4 text-white focus:border-accent-mint focus:outline-none w-full md:w-48"
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as TransactionType | '')}
            className="bg-darker-bg border border-gray-700 rounded-md py-2 px-3 text-white focus:border-accent-mint focus:outline-none"
          >
            <option value="">Tous types</option>
            <option value="ORDER">Commandes</option>
            <option value="BALANCE_RECHARGE">Recharges</option>
            <option value="INSCRIPTION">Inscriptions</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as PaymentStatus | '')}
            className="bg-darker-bg border border-gray-700 rounded-md py-2 px-3 text-white focus:border-accent-mint focus:outline-none"
          >
            <option value="">Tous statuts</option>
            <option value="PENDING">En attente</option>
            <option value="PAID">Payé</option>
            <option value="REFUNDED">Remboursé</option>
          </select>
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value as PaymentMethod | '')}
            className="bg-darker-bg border border-gray-700 rounded-md py-2 px-3 text-white focus:border-accent-mint focus:outline-none"
          >
            <option value="">Toutes méthodes</option>
            <option value="HELLOASSO">HelloAsso</option>
            <option value="PAYPAL">PayPal</option>
            <option value="CASH_CB">Espèces/CB</option>
          </select>
          <button
            onClick={fetchTransactions}
            className="bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors flex items-center whitespace-nowrap"
          >
            <RefreshCw size={18} className="mr-2" /> Actualiser
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-darker-bg border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl font-bold text-white">{transactions.length}</p>
        </div>
        <div className="bg-darker-bg border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">En attente</p>
          <p className="text-2xl font-bold text-yellow-400">
            {transactions.filter(t => t.paymentStatus === 'PENDING').length}
          </p>
        </div>
        <div className="bg-darker-bg border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Payées</p>
          <p className="text-2xl font-bold text-green-400">
            {transactions.filter(t => t.paymentStatus === 'PAID').length}
          </p>
        </div>
        <div className="bg-darker-bg border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Remboursées</p>
          <p className="text-2xl font-bold text-red-400">
            {transactions.filter(t => t.paymentStatus === 'REFUNDED').length}
          </p>
        </div>
      </div>

      <div className="bg-darker-bg border border-gray-700 rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                Description
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                Méthode
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                Date
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  Aucune transaction trouvée
                </td>
              </tr>
            ) : (
              filteredTransactions.map(tx => {
                const displayType = getDisplayType(tx);
                return (
                <tr key={tx.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(displayType)}`}
                    >
                      {getTypeIcon(displayType)}
                      <span className="hidden sm:inline">{TYPE_LABELS[displayType]}</span>
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white capitalize">
                      {tx.user.firstName} {tx.user.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{tx.user.email}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                    <div className="text-sm text-gray-300 max-w-xs truncate">{tx.description}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {formatAmount(tx.amount, tx.bonusAmount)}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className="text-sm text-gray-300">{METHOD_LABELS[tx.paymentMethod]}</span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(tx.paymentStatus)}`}
                    >
                      {STATUS_LABELS[tx.paymentStatus]}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-400 hidden lg:table-cell">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenDetail(tx)}
                      className="text-accent-mint hover:text-white mr-2"
                      title="Voir détails"
                    >
                      <ExternalLink size={18} />
                    </button>
                    {canRefresh(tx) && (
                      <button
                        onClick={() => handleRefreshStatus(tx)}
                        disabled={refreshingId === tx.id}
                        className={`text-blue-400 hover:text-blue-300 ${refreshingId === tx.id ? 'animate-spin' : ''}`}
                        title="Rafraîchir le statut"
                      >
                        <RefreshCw size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              );})
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Détails de la transaction"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Type</p>
                <p className="text-white font-medium">{TYPE_LABELS[getDisplayType(selectedTransaction)]}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">ID Entité</p>
                <p className="text-white font-medium">#{selectedTransaction.entityId}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Utilisateur</p>
                <p className="text-white font-medium capitalize">
                  {selectedTransaction.user.firstName} {selectedTransaction.user.lastName}
                </p>
                <p className="text-gray-500 text-sm">{selectedTransaction.user.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Montant</p>
                <p className="text-white font-medium">
                  {formatAmount(selectedTransaction.amount, selectedTransaction.bonusAmount)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Méthode de paiement</p>
                <p className="text-white font-medium">{METHOD_LABELS[selectedTransaction.paymentMethod]}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Statut</p>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedTransaction.paymentStatus)}`}
                >
                  {STATUS_LABELS[selectedTransaction.paymentStatus]}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400 text-sm">Description</p>
                <p className="text-white">{selectedTransaction.description}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400 text-sm">ID Transaction Provider</p>
                <p className="text-white font-mono text-sm break-all">
                  {selectedTransaction.paymentTransactionId || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Créé le</p>
                <p className="text-white">{formatDate(selectedTransaction.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Mis à jour le</p>
                <p className="text-white">{formatDate(selectedTransaction.updatedAt)}</p>
              </div>
            </div>

            {canRefresh(selectedTransaction) && (
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    handleRefreshStatus(selectedTransaction);
                    setIsDetailModalOpen(false);
                  }}
                  disabled={refreshingId === selectedTransaction.id}
                  className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-500 transition-colors flex items-center justify-center"
                >
                  <RefreshCw size={18} className={`mr-2 ${refreshingId === selectedTransaction.id ? 'animate-spin' : ''}`} />
                  Rafraîchir le statut depuis le provider
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionManagementPage;
