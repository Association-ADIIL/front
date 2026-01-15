import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { forgotPassword } from '../api/auth';

const ForgotPasswordPage: React.FC = () => {
  useDocumentTitle('Mot de passe oublié');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
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
            <h1 className="text-2xl font-koulen text-white mb-4">EMAIL ENVOYÉ</h1>
            <p className="text-gray-400 font-montserrat mb-6">
              Si un compte existe avec l'adresse <span className="text-white font-semibold">{email}</span>, tu recevras un email avec les instructions pour réinitialiser ton mot de passe.
            </p>
            <p className="text-gray-500 text-sm font-montserrat mb-6">
              Pense à vérifier tes spams si tu ne reçois rien d'ici quelques minutes.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-accent-mint hover:text-white transition-colors font-semibold"
            >
              <ArrowLeft size={18} />
              Retour à la connexion
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
          <h1 className="text-2xl font-koulen text-white mt-4">MOT DE PASSE OUBLIÉ</h1>
          <p className="text-gray-500 mt-2 font-montserrat text-sm">
            Entre ton adresse email pour recevoir un lien de réinitialisation
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
              <label htmlFor="email" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-bg border border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent-mint transition-colors"
                  placeholder="votre.email@etu.univ-lemans.fr"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent-mint text-darker-bg font-bold py-4 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-darker-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={20} />
                  Envoyer le lien
                </>
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

export default ForgotPasswordPage;
