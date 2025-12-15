import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../api/users';
import { addBalanceManually } from '../api/balance';
import { useNotification } from '../context/NotificationContext';
import Modal from './Modal';
import { Loader, Plus } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  balance?: number;
}

interface AddBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddBalanceModal: React.FC<AddBalanceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addNotification } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification('error', 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !amount) {
      addNotification('error', 'Veuillez sélectionner un utilisateur et entrer un montant');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      addNotification('error', 'Montant invalide');
      return;
    }

    setLoading(true);
    try {
      await addBalanceManually({
        userId: parseInt(selectedUserId),
        amount: amountNum,
      });

      addNotification('success', `${amountNum}€ ajouté au solde avec succès !`);
      setSelectedUserId('');
      setAmount('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      addNotification('error', error.message || 'Erreur lors de l\'ajout du solde');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recharger le solde d'un utilisateur">
      <form onSubmit={handleSubmit} className="space-y-4">
        {loadingUsers ? (
          <div className="flex justify-center py-8">
            <Loader className="animate-spin text-accent-mint" size={32} />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-gray-400 mb-2 font-bold">Rechercher un utilisateur</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nom, prénom ou email..."
                className="w-full bg-dark-bg border border-gray-600 rounded px-4 py-2 text-white focus:border-accent-mint outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2 font-bold">Utilisateur</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-dark-bg border border-gray-600 rounded px-4 py-2 text-white focus:border-accent-mint outline-none"
                required
              >
                <option value="">Sélectionner un utilisateur</option>
                {filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                    {user.balance !== undefined && ` - Solde: ${user.balance.toFixed(2)}€`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-2 font-bold">Montant à ajouter (€)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.00"
                className="w-full bg-dark-bg border border-gray-600 rounded px-4 py-2 text-white focus:border-accent-mint outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-accent-mint text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Ajouter le solde
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default AddBalanceModal;
