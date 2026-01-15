import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { resetPassword } from '../api/auth';

const ResetPasswordPage: React.FC = () => {
  useDocumentTitle('Réinitialiser le mot de passe');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!token) {
      setError('Token manquant. Veuillez refaire une demande de réinitialisation.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Le lien a peut-être expiré.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <span className="text-4xl font-koulen text-accent-mint">ADIIL</span>
            </Link>
          </div>

          {/* Success Card */}
          <div className="bg-darker-bg rounded-2xl border border-gray-800 p-8 text-center">
            <div className="w-16 h-16 bg-accent-mint/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-accent-mint" />
            </div>
            <h1 className="text-2xl font-koulen text-white mb-4">MOT DE PASSE MODIFIÉ</h1>
            <p className="text-gray-400 font-montserrat mb-6">
              Ton mot de passe a été réinitialisé avec succès. Tu peux maintenant te connecter avec ton nouveau mot de passe.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-accent-mint text-darker-bg font-bold py-4 rounded-xl hover:bg-white transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <span className="text-4xl font-koulen text-accent-mint">ADIIL</span>
            </Link>
          </div>

          {/* Error Card */}
          <div className="bg-darker-bg rounded-2xl border border-gray-800 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-koulen text-white mb-4">LIEN INVALIDE</h1>
            <p className="text-gray-400 font-montserrat mb-6">
              Ce lien de réinitialisation est invalide ou a expiré. Veuillez refaire une demande.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block w-full bg-accent-mint text-darker-bg font-bold py-4 rounded-xl hover:bg-white transition-colors text-center"
            >
              Nouvelle demande
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-4xl font-koulen text-accent-mint">ADIIL</span>
          </Link>
          <h1 className="text-2xl font-koulen text-white mt-4">NOUVEAU MOT DE PASSE</h1>
          <p className="text-gray-500 mt-2 font-montserrat text-sm">
            Choisis un nouveau mot de passe pour ton compte
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-darker-bg rounded-2xl border border-gray-800 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm text-center font-montserrat">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-bg border border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent-mint transition-colors"
                  placeholder="Minimum 6 caractères"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-dark-bg border border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent-mint transition-colors"
                  placeholder="Confirme ton mot de passe"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent-mint text-darker-bg font-bold py-4 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-darker-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-gray-500 hover:text-accent-mint transition-colors font-montserrat"
            >
              <ArrowLeft size={18} />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
