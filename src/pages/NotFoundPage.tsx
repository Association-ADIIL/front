import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, Calendar, ShoppingBag } from 'lucide-react';
import SEO from '../components/SEO';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-darker-bg relative overflow-hidden flex items-center justify-center">
      <SEO
        title="404 - Page non trouvee"
        description="La page que vous recherchez n'existe pas sur le site ADIIL."
        noindex={true}
      />

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-accent-mint/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -left-40 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Diagonal lines pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 40px,
          rgba(119,241,190,0.5) 40px,
          rgba(119,241,190,0.5) 41px
        )`
      }} />

      {/* Floating code snippet */}
      <div className="absolute top-20 right-20 hidden xl:block opacity-20 font-mono text-xs text-red-400/60 animate-[float_6s_ease-in-out_infinite]">
        <div className="bg-darker-bg/80 backdrop-blur border border-red-500/20 rounded-lg p-3">
          <span className="text-gray-500">// error</span><br/>
          <span className="text-purple-400">throw new</span> <span className="text-red-400">Error</span>(<span className="text-amber-400">"404"</span>);
        </div>
      </div>

      <div className="absolute bottom-32 left-20 hidden xl:block opacity-20 font-mono text-xs text-accent-mint/60 animate-[float_8s_ease-in-out_infinite_2s]">
        <div className="bg-darker-bg/80 backdrop-blur border border-accent-mint/20 rounded-lg p-3">
          <span className="text-purple-400">if</span> (page === <span className="text-amber-400">null</span>) {"{"}<br/>
          &nbsp;&nbsp;<span className="text-accent-mint">goHome</span>();<br/>
          {"}"}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {/* Glitchy 404 */}
        <div className="relative mb-8">
          <h1 className="text-[10rem] sm:text-[14rem] font-koulen leading-none text-transparent bg-clip-text bg-gradient-to-b from-accent-mint to-accent-mint/30 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10rem] sm:text-[14rem] font-koulen leading-none text-accent-mint/10 animate-pulse select-none">
              404
            </span>
          </div>
        </div>

        {/* Terminal style message */}
        <div className="bg-dark-bg border border-gray-800 rounded-xl p-6 mb-8 text-left font-mono">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-gray-500 text-xs">terminal</span>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-accent-mint">$</span>{' '}
              <span className="text-gray-400">cd</span>{' '}
              <span className="text-white">{typeof window !== 'undefined' ? window.location.pathname : '/unknown'}</span>
            </p>
            <p className="text-red-400">
              bash: cd: page introuvable
            </p>
            <p>
              <span className="text-accent-mint">$</span>{' '}
              <span className="text-gray-500 animate-pulse">_</span>
            </p>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-koulen text-white mb-3">
          OUPS, <span className="text-accent-mint">PAGE INTROUVABLE</span>
        </h2>
        <p className="text-gray-400 mb-8 font-montserrat">
          La page que tu cherches n'existe pas ou a ete deplacee.
          Pas de panique, retourne a l'accueil !
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Link
            to="/"
            className="group flex items-center gap-2 px-6 py-3 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(119,241,190,0.3)]"
          >
            <Home size={20} />
            Retour a l'accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 px-6 py-3 bg-dark-bg border border-gray-700 text-white font-bold rounded-xl hover:border-accent-mint/50 hover:bg-accent-mint/5 transition-all duration-300"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Page precedente
          </button>
        </div>

        {/* Quick links */}
        <div className="pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm mb-4">Ou explore ces pages :</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/events"
              className="flex items-center gap-2 px-4 py-2 bg-dark-bg border border-gray-800 rounded-lg text-gray-400 hover:text-accent-mint hover:border-accent-mint/30 transition-all text-sm"
            >
              <Calendar size={16} />
              Evenements
            </Link>
            <Link
              to="/shop"
              className="flex items-center gap-2 px-4 py-2 bg-dark-bg border border-gray-800 rounded-lg text-gray-400 hover:text-accent-mint hover:border-accent-mint/30 transition-all text-sm"
            >
              <ShoppingBag size={16} />
              Boutique
            </Link>
            <Link
              to="/about"
              className="flex items-center gap-2 px-4 py-2 bg-dark-bg border border-gray-800 rounded-lg text-gray-400 hover:text-accent-mint hover:border-accent-mint/30 transition-all text-sm"
            >
              <Search size={16} />
              A propos
            </Link>
          </div>
        </div>
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
