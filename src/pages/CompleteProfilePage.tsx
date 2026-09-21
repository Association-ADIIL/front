import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/auth';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../types/errors';

type Filiere = 'INFO' | 'MMI' | 'TC' | 'BIO' | 'AUTRES';

const FILIERE_OPTIONS: { value: Filiere; label: string }[] = [
  { value: 'INFO', label: 'INFO' },
  { value: 'MMI', label: 'MMI' },
  { value: 'TC', label: 'TC' },
  { value: 'BIO', label: 'BIO' },
  { value: 'AUTRES', label: 'Autre' },
];

const CompleteProfilePage: React.FC = () => {
  const [filiere, setFiliere] = useState<Filiere | ''>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user, refreshUser, logout } = useAuth();

  // Dès que la filière est renseignée (ou si elle l'était déjà), on quitte la page.
  useEffect(() => {
    if (user?.filiere) {
      navigate('/my-account', { replace: true });
    }
  }, [user?.filiere, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!filiere) {
      addNotification('error', 'Merci de renseigner ta filière');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ filiere });
      // Recharge l'utilisateur : c'est ce qui déclenche la sortie de la page
      await refreshUser();
      addNotification('success', 'Profil complété avec succès');
    } catch (error) {
      logger.error('Failed to complete profile', error);
      addNotification('error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-darker-bg p-4">
      <div className="w-full max-w-md bg-dark-bg rounded-2xl border border-gray-800 shadow-2xl p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-accent-mint/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={26} className="text-accent-mint" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Complète ton profil</h1>
          <p className="text-sm text-gray-400">
            Encore une étape avant de profiter de l'ADIIL
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Filière */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Filière
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FILIERE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFiliere(option.value)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    filiere === option.value
                      ? 'border-accent-mint bg-accent-mint/10 text-white'
                      : 'border-gray-800 bg-darker-bg text-gray-400 hover:border-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !filiere}
            className="w-full py-4 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-accent-mint/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-lg shadow-accent-mint/20 disabled:shadow-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-darker-bg border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Continuer
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => logout()}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default CompleteProfilePage;