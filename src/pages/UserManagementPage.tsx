import React, { useEffect, useState } from 'react';
import { getAllUsers, deleteUser, createUser, updateUser } from '../api/users';
import { type User } from '../api/auth';
import { Edit2, Trash2, Plus, User as UserIcon, Search } from 'lucide-react';
import Modal from '../components/Modal';

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    type: 'STUDENT',
    studentGroup: '',
    password: '', // Only for creation
  });

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
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
  }, [searchTerm, users]);

  const handleOpenCreate = () => {
    setCurrentUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      type: 'STUDENT',
      studentGroup: '',
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
      studentGroup: user.studentGroup || '',
      password: '', // Don't show password on edit
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
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
    } catch (error) {
      console.error("Failed to save user:", error);
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
      console.error("Failed to delete user:", error);
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
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-4xl font-bold text-accent-mint font-koulen">GESTION DES UTILISATEURS</h1>
        <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
                <input 
                    type="text" 
                    placeholder="Rechercher un utilisateur..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-darker-bg border border-gray-700 rounded-md py-2 pl-10 pr-4 text-white focus:border-accent-mint focus:outline-none w-full md:w-64"
                />
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <button onClick={handleOpenCreate} className="bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors flex items-center whitespace-nowrap">
            <Plus size={20} className="mr-2" /> Ajouter
            </button>
        </div>
      </div>

      <div className="bg-darker-bg border border-gray-700 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Utilisateur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Groupe</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                        <UserIcon size={20} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white capitalize">{user.firstName} {user.lastName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.type.includes('ADMIN') ? 'bg-purple-900/50 text-purple-200' : 
                    user.type === 'PROFESSOR' ? 'bg-blue-900/50 text-blue-200' : 
                    'bg-green-900/50 text-green-200'
                  }`}>
                    {user.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {user.studentGroup || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenEdit(user)} className="text-accent-mint hover:text-white mr-4"><Edit2 size={18} /></button>
                  <button onClick={() => handleOpenDelete(user)} className="text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                    <label className="block text-gray-400 mb-1">Groupe TP</label>
                    <select name="studentGroup" value={formData.studentGroup} onChange={handleChange} className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white">
                        <option value="">Aucun</option>
                        <option value="G11A">11A</option>
                        <option value="G11B">11B</option>
                        <option value="G12C">12C</option>
                        <option value="G12D">12D</option>
                        <option value="G21A">21A</option>
                        <option value="G21B">21B</option>
                        <option value="G22C">22C</option>
                        <option value="G22D">22D</option>
                        <option value="G31A">31A</option>
                        <option value="G31B">31B</option>
                        <option value="G32C">32C</option>
                        <option value="G32D">32D</option>
                    </select>
                </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="mr-4 px-4 py-2 text-gray-300 hover:text-white">Annuler</button>
              <button type="submit" className="bg-accent-mint text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors">Enregistrer</button>
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
            <p className="mb-6 text-lg">Êtes-vous sûr de vouloir supprimer l'utilisateur <span className="font-bold text-accent-mint">{userToDelete?.firstName} {userToDelete?.lastName}</span> ?</p>
            <div className="flex justify-center space-x-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Annuler</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">Supprimer</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagementPage;