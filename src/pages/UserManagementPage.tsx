import React, { useEffect, useState, useMemo } from 'react';
import { logger } from '../utils/logger';
import { getAllUsers, deleteUser, createUser, updateUser } from '../api/users';
import { getUserBalance } from '../api/balance';
import { type User, getMe } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Edit2, Trash2, Plus, User as UserIcon, Search, Eye, Mail, Calendar, CreditCard, Users, Loader } from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const ITEMS_PER_PAGE = 50;

const UserManagementPage: React.FC = () => {
  useDocumentTitle('Admin - Utilisateurs');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserBalance, setSelectedUserBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const { refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    type: 'STUDENT',
    filiere: '',
    password: '', // Only for creation
  });

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      logger.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = users.filter(user =>
        user.firstName.toLowerCase().includes(lowerTerm) ||
        user.lastName.toLowerCase().includes(lowerTerm) ||
        user.email.toLowerCase().includes(lowerTerm)
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, users]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleOpenCreate = () => {
    setCurrentUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      type: 'STUDENT',
      filiere: '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setCurrentUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      type: user.type,
      filiere: user.filiere || '',
      password: '', // Don't show password on edit
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleOpenDetail = async (user: User) => {
    setSelectedUser(user);
    setSelectedUserBalance(null);
    setIsDetailModalOpen(true);

    if (!user.deletedAt) {
      setLoadingBalance(true);
      try {
        const { balance } = await getUserBalance(user.id);
        setSelectedUserBalance(balance);
      } catch (error) {
        logger.error('Failed to fetch user balance', error);
        setSelectedUserBalance(0);
      } finally {
        setLoadingBalance(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentUser) {
        // Only include password if it's not empty
        const updateData: any = { ...formData };
        if (!updateData.password) {
            delete updateData.password;
        }
        await updateUser(currentUser.id, updateData);
      } else {
        await createUser({
          ...formData,
          type: formData.type as 'STUDENT' | 'PROFESSOR' | 'EXTERNAL' | 'ADMIN_BDE' | 'ADMIN_PROF',
        });
      }
      setIsModalOpen(false);
      fetchUsers();
      await refreshUser();
    } catch (error) {
      logger.error('Failed to save user', error);
      alert("Erreur lors de l'enregistrement de l'utilisateur.");
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      logger.error('Failed to delete user', error);
      alert("Erreur lors de la suppression.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="text-center p-8">Chargement...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 bg-blue-500 rounded-full hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wide">Systeme</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white font-koulen">UTILISATEURS</h1>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-darker-bg border border-gray-800 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none w-full md:w-64 transition-colors"
            />
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap hover:shadow-lg hover:shadow-blue-500/20"
          >
            <Plus size={18} /> Ajouter
          </button>
        </div>
      </div>

      <div className="bg-darker-bg border border-gray-700 rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Utilisateur</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Filière</th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedUsers.map((user) => (
              <tr key={user.id} className={`transition-colors ${user.deletedAt ? 'opacity-50 bg-red-900/10' : 'hover:bg-gray-800/50'}`}>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center ${user.deletedAt ? 'bg-red-900/50 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                        <UserIcon size={18} className="sm:hidden" />
                        <UserIcon size={20} className="hidden sm:block" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <div className={`text-sm font-medium capitalize ${user.deletedAt ? 'text-gray-400 line-through' : 'text-white'}`}>
                        {user.firstName} {user.lastName}
                        {user.deletedAt && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-900/50 text-red-300 no-underline inline-block">
                            Supprimé
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 md:hidden">{user.deletedAt ? 'Compte supprimé' : user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                  <div className={`text-sm ${user.deletedAt ? 'text-gray-500' : 'text-gray-300'}`}>
                    {user.deletedAt ? 'Compte supprimé' : user.email}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.deletedAt ? 'bg-red-900/50 text-red-300' :
                    user.type.includes('ADMIN') ? 'bg-purple-900/50 text-purple-200' :
                    user.type === 'PROFESSOR' ? 'bg-blue-900/50 text-blue-200' :
                    'bg-green-900/50 text-green-200'
                  }`}>
                    {user.deletedAt ? 'SUPPRIMÉ' : user.type}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-400 hidden sm:table-cell">
                  {user.filiere || '-'}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenDetail(user)} className="text-gray-400 hover:text-white mr-3 sm:mr-4" title="Voir les détails"><Eye size={18} /></button>
                  {user.deletedAt ? (
                    <span className="text-gray-500 text-xs">Supprimé</span>
                  ) : (
                    <>
                      <button onClick={() => handleOpenEdit(user)} className="text-blue-400 hover:text-white mr-3 sm:mr-4" title="Modifier"><Edit2 size={18} /></button>
                      <button onClick={() => handleOpenDelete(user)} className="text-red-400 hover:text-red-300" title="Supprimer"><Trash2 size={18} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredUsers.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={currentUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-gray-400 mb-1">Prénom</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
                <label className="block text-gray-400 mb-1">Nom</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div className="md:col-span-2">
                <label className="block text-gray-400 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div className="md:col-span-2">
                <label className="block text-gray-400 mb-1">Mot de passe {currentUser && "(laisser vide pour ne pas changer)"}</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required={!currentUser} className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
                <label className="block text-gray-400 mb-1">Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white">
                    <option value="STUDENT">Étudiant</option>
                    <option value="PROFESSOR">Professeur</option>
                    <option value="EXTERNAL">Externe</option>
                    <option value="ADMIN_BDE">Admin BDE</option>
                    <option value="ADMIN_PROF">Admin Prof</option>
                </select>
            </div>
            {(formData.type === 'STUDENT' || formData.type === 'ADMIN_BDE') && (
                <div>
                    <label className="block text-gray-400 mb-1">Filière</label>
                    <select name="filiere" value={formData.filiere} onChange={handleChange} className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white">
                        <option value="">Aucun</option>
                        <option value="INFO">INFO</option>
                        <option value="MMI">MMI</option>
                        <option value="TC">TC</option>
                        <option value="BIO">BIO</option>
                    </select>
                </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="mr-4 px-4 py-2 text-gray-300 hover:text-white">Annuler</button>
              <button type="submit" className="bg-blue-400 text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors">Enregistrer</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
      >
        <div className="text-center">
            <p className="mb-6 text-lg">Êtes-vous sûr de vouloir supprimer l'utilisateur <span className="font-bold text-blue-400">{userToDelete?.firstName} {userToDelete?.lastName}</span> ?</p>
            <div className="flex justify-center space-x-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Annuler</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">Supprimer</button>
            </div>
        </div>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Détails de l'utilisateur"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-700">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                selectedUser.deletedAt ? 'bg-red-900/50 text-red-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {selectedUser.firstName[0]}{selectedUser.lastName[0]}
              </div>
              <div>
                <h3 className={`text-xl font-bold capitalize ${selectedUser.deletedAt ? 'text-gray-400 line-through' : 'text-white'}`}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedUser.deletedAt ? 'bg-red-900/50 text-red-300' :
                  selectedUser.type.includes('ADMIN') ? 'bg-purple-900/50 text-purple-200' :
                  selectedUser.type === 'PROFESSOR' ? 'bg-blue-900/50 text-blue-200' :
                  'bg-green-900/50 text-green-200'
                }`}>
                  {selectedUser.deletedAt ? 'SUPPRIMÉ' : selectedUser.type}
                </span>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="bg-dark-bg rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Mail size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                    <p className={`font-medium ${selectedUser.deletedAt ? 'text-gray-500' : 'text-white'}`}>
                      {selectedUser.deletedAt ? 'Compte supprimé' : selectedUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="bg-dark-bg rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CreditCard size={18} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Solde</p>
                    {selectedUser.deletedAt ? (
                      <p className="text-gray-500 font-medium">N/A</p>
                    ) : loadingBalance ? (
                      <div className="flex items-center gap-2">
                        <Loader size={14} className="animate-spin text-gray-400" />
                        <span className="text-gray-400 text-sm">Chargement...</span>
                      </div>
                    ) : (
                      <p className="text-green-400 font-koulen text-xl">{selectedUserBalance?.toFixed(2) ?? '0.00'} EUR</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Group */}
              <div className="bg-dark-bg rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Users size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Filière</p>
                    <p className="text-white font-medium">{selectedUser.filiere || 'Aucun'}</p>
                  </div>
                </div>
              </div>

              {/* Created at */}
              <div className="bg-dark-bg rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Calendar size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Inscrit le</p>
                    <p className="text-white font-medium">
                      {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ID */}
            <div className="text-center pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">ID Utilisateur: <span className="font-mono text-gray-400">{selectedUser.id}</span></p>
            </div>

            {/* Actions */}
            {!selectedUser.deletedAt && (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEdit(selectedUser);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-400 transition-colors flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Modifier
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagementPage;