import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileX, Loader2, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { getSharedFileUrl } from '../api/upload';

const ShareFilePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Lien de partage invalide');
      setIsRedirecting(false);
      return;
    }

    // Redirect to the API endpoint which will handle the file access
    const redirectUrl = getSharedFileUrl(token);
    window.location.href = redirectUrl;

    // If redirect doesn't happen within 3 seconds, show an error
    const timeout = setTimeout(() => {
      setIsRedirecting(false);
      setError('La redirection a echoue. Cliquez sur le bouton ci-dessous pour reessayer.');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [token]);

  if (isRedirecting && !error) {
    return (
      <div className="min-h-screen bg-darker-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-accent-mint animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Redirection vers le fichier...</p>
          <p className="text-gray-400 text-sm mt-2">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darker-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-bg rounded-2xl border border-gray-800 p-8 text-center">
        {error ? (
          <>
            {error.includes('expire') || error.includes('limite') ? (
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock size={32} className="text-orange-400" />
              </div>
            ) : error.includes('invalide') ? (
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileX size={32} className="text-red-400" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-yellow-400" />
              </div>
            )}
            <h1 className="text-2xl font-koulen text-white mb-3">ACCES AU FICHIER</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            {error.includes('reessayer') && token && (
              <a
                href={getSharedFileUrl(token)}
                className="inline-flex items-center gap-2 bg-accent-mint text-darker-bg font-bold py-3 px-6 rounded-xl hover:bg-white transition-colors mb-4"
              >
                Reessayer
              </a>
            )}
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-accent-mint transition-colors"
              >
                <ArrowLeft size={18} />
                Retour a l'accueil
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileX size={32} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-koulen text-white mb-3">LIEN INVALIDE</h1>
            <p className="text-gray-400 mb-6">Ce lien de partage n'existe pas ou a ete supprime.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-accent-mint transition-colors"
            >
              <ArrowLeft size={18} />
              Retour a l'accueil
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ShareFilePage;
