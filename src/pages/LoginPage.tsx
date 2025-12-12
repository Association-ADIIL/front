import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Échec de la connexion. Vérifiez vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-98px)]">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-accent-mint mb-6">Connexion</h1>
        {error && <div className="mb-4 text-red-500 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900">{error}</div>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg border-gray-600 focus:border-accent-mint text-white"
              placeholder="********"
              required
            />
          </div>
          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline hover-scale-sm transition-opacity ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
            <Link to="/register" className="inline-block align-baseline font-bold text-sm text-accent-mint hover:text-white transition-colors">
              Pas encore de compte ? S'inscrire
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;