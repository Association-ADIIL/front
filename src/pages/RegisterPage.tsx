import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: 'STUDENT',
    studentGroup: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id === 'name' ? 'lastName' : e.target.id === 'firstname' ? 'firstName' : e.target.id === 'tpGroup' ? 'studentGroup' : e.target.id === 'accountType' ? 'type' : e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (formData.type === 'STUDENT' && !formData.studentGroup) {
       setError("Le groupe TP est obligatoire pour les étudiants.");
       return;
    }

    setIsLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        type: formData.type,
        studentGroup: formData.type === 'STUDENT' ? formData.studentGroup : undefined
      });
      // Redirect handled in AuthContext or here if needed (AuthContext currently redirects to login)
    } catch (err: any) {
      setError(err.message || 'Échec de l\'inscription.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-98px)] py-12">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-accent-mint mb-6">Inscription</h1>
        {error && <div className="mb-4 text-red-500 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900">{error}</div>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-gray-300 text-sm font-bold mb-2">Nom</label>
            <input
              type="text"
              id="name"
              value={formData.lastName}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg border-gray-600 focus:border-accent-mint text-white"
              placeholder="Votre Nom"
              required
            />
          </div>
          <div>
            <label htmlFor="firstname" className="block text-gray-300 text-sm font-bold mb-2">Prénom</label>
            <input
              type="text"
              id="firstname"
              value={formData.firstName}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg border-gray-600 focus:border-accent-mint text-white"
              placeholder="Votre Prénom"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg border-gray-600 focus:border-accent-mint text-white"
              placeholder="votre.email@etu.univ-lemans.fr"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg border-gray-600 focus:border-accent-mint text-white"
              placeholder="********"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-bold mb-2">Confirmer mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg border-gray-600 focus:border-accent-mint text-white"
              placeholder="********"
              required
            />
          </div>
          <div>
            <label htmlFor="accountType" className="block text-gray-300 text-sm font-bold mb-2">Type de compte</label>
            <select
              id="accountType"
              value={formData.type}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg border-gray-600 focus:border-accent-mint text-white"
            >
              <option value="STUDENT">Étudiant</option>
              <option value="PROFESSOR">Professeur</option>
              <option value="EXTERNAL">Externe</option>
            </select>
          </div>
          {formData.type === 'STUDENT' && (
            <div>
              <label htmlFor="tpGroup" className="block text-gray-300 text-sm font-bold mb-2">Groupe TP</label>
              <select
                id="tpGroup"
                value={formData.studentGroup}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg border-gray-600 focus:border-accent-mint text-white"
                required
              >
                <option value="">Sélectionner un groupe</option>
                <option value="G11A">G11A</option>
                <option value="G11B">G11B</option>
                <option value="G12C">G12C</option>
                <option value="G12D">G12D</option>
                <option value="G21A">G21A</option>
                <option value="G21B">G21B</option>
                <option value="G22C">G22C</option>
                <option value="G22D">G22D</option>
                <option value="G31A">G31A</option>
                <option value="G31B">G31B</option>
                <option value="G32C">G32C</option>
                <option value="G32D">G32D</option>
              </select>
            </div>
          )}
          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline hover-scale-sm transition-opacity ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Inscription...' : 'S\'inscrire'}
            </button>
            <Link to="/login" className="inline-block align-baseline font-bold text-sm text-accent-mint hover:text-white transition-colors">
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;