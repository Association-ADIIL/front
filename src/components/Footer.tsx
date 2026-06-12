import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';

const Footer: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <footer className="bg-darker-bg text-white py-12 mt-auto border-t border-gray-800 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 40px,
          rgba(119,241,190,0.5) 40px,
          rgba(119,241,190,0.5) 41px
        )`
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          {/* Logo & description */}
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
              <div className="w-8 h-8 bg-accent-mint/10 rounded-lg flex items-center justify-center">
                <Terminal size={16} className="text-accent-mint" />
              </div>
              <h3 className="font-koulen text-2xl text-white">
                <span className="text-accent-mint">ADIIL</span>
              </h3>
            </div>
            <p className="text-gray-500 text-sm font-montserrat">
              Association du Departement Informatique de l'IUT de Laval
            </p>
          </div>

          {/* Navigation links */}
          <div className="flex items-center gap-2">
            <Link to="/events" className="px-3 py-2 text-gray-400 hover:text-white hover:bg-dark-bg rounded-lg transition-all text-sm">
              Events
            </Link>
            <Link to="/shop" className="px-3 py-2 text-gray-400 hover:text-white hover:bg-dark-bg rounded-lg transition-all text-sm">
              Boutique
            </Link>
            <Link to="/about" className="px-3 py-2 text-gray-400 hover:text-white hover:bg-dark-bg rounded-lg transition-all text-sm">
              A propos
            </Link>
          </div>
        </div>

        {/* Bottom section with legal links */}
        <div className="pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs font-mono">
            &copy; {new Date().getFullYear()} ADIIL - Fait avec{' '}
            <span
              className="relative inline-block cursor-pointer"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <span className={`text-accent-mint transition-all duration-300 inline-block ${showTooltip ? 'scale-125 animate-pulse' : ''}`}>
                {'<3'}
              </span>
              {showTooltip && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-accent-mint text-darker-bg text-xs font-bold rounded whitespace-nowrap animate-[fadeIn_0.2s_ease-out]">
                  Merci Claude
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-accent-mint" />
                </span>
              )}
            </span>
            {' '}par des etudiants
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link to="/legal" className="text-gray-500 hover:text-accent-mint text-xs transition-colors">Mentions Legales</Link>
            <Link to="/cgu" className="text-gray-500 hover:text-accent-mint text-xs transition-colors">CGU</Link>
            <Link to="/cgv" className="text-gray-500 hover:text-accent-mint text-xs transition-colors">CGV</Link>
            <Link to="/confidentialite" className="text-gray-500 hover:text-accent-mint text-xs transition-colors">Confidentialite</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;